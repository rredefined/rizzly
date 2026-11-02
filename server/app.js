import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

const app = express();
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_IMAGES, fields: 12, fieldSize: 12 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Upload PNG, JPG, or WEBP screenshots only.'));
    cb(null, true);
  }
});

app.disable('x-powered-by');
// Vercel runs behind a trusted proxy; this lets rate limiting use the visitor IP.
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'RIZZLY is getting a lot of requests. Please wait a minute and try again.' }
}));

const systemInstructions = `You are RIZZLY, a friendly texting and conversation assistant. Help people communicate naturally, confidently, and respectfully. Keep all flirting light, age-appropriate, consensual, and non-sexual. Never pressure someone, encourage manipulation, or assume romantic interest from limited evidence. Match the requested language (English, Hindi, or natural Hinglish) and requested tone. Avoid robotic, overlong, generic replies. Do not use emojis unless requested. Return concise, useful output. When asked for multiple replies, return a JSON object with a short summary and a replies array. Each reply item must contain label and text.`;

function safeText(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function taskPrompt(task, data) {
  const common = `Language: ${safeText(data.language, 30) || 'Hinglish'}. Tone: ${safeText(data.tone, 60) || 'Natural & casual'}. Length: ${safeText(data.length, 30) || 'Short'}. Context: ${safeText(data.context, 1500) || 'Not provided'}.`;
  const prompts = {
    rizz: `Generate 5 distinct, natural message options for this situation: ${safeText(data.prompt)}. Who they are texting: ${safeText(data.person, 100) || 'Someone they like'}. ${common} Intensity: ${safeText(data.intensity, 30) || 'Subtle'}. Return JSON with summary and replies (label,text).`,
    reply: `Suggest 5 natural replies to this message: ${safeText(data.prompt)}. ${common} Reply styles should vary: natural, playful, sweet, confident, and lightly flirty where appropriate. Return JSON with summary and replies (label,text).`,
    starters: `Create 8 conversation starters for this situation/person: ${safeText(data.prompt)}. Interests: ${safeText(data.interests, 500) || 'Unknown'}. ${common} Avoid interview-like questions and generic openers. Return JSON with summary and replies (label,text).`,
    translate: `Rewrite this message in the selected style (${safeText(data.tone, 60) || 'Smooth'}): ${safeText(data.prompt)}. Language: ${safeText(data.language, 30) || 'Hinglish'}. Give 4 variations, preserving the original meaning. Return JSON with summary and replies (label,text).`,
    wingman: `Give practical texting advice and a natural next message for this situation: ${safeText(data.prompt)}. ${common} Be supportive, don't overinterpret. Return JSON with summary and replies (label,text).`,
    pickup: `Generate 8 lighthearted, respectful pickup lines or social bio ideas based on: ${safeText(data.prompt)}. Style: ${safeText(data.tone, 60) || 'Playful'}. Language: ${safeText(data.language, 30) || 'Hinglish'}. Keep it non-sexual and not pushy. Return JSON with summary and replies (label,text).`,
    scanner: `Analyze the attached chat screenshot(s). Read only what is visible. Infer speaker identity only from bubble alignment, labels, or clear context; if uncertain, say so. Respect screenshot order. Summarize the conversation, identify the latest visible message, describe the tone cautiously, and suggest 5 possible next replies. Do not claim to know what the other person secretly feels. If text is unreadable, flag it. User preferences: ${common} Reply intensity: ${safeText(data.intensity, 30) || 'Subtle'}. Return JSON with summary, mood, latestMessage, caveat, and replies (label,text).`
  };
  return prompts[task] || prompts.reply;
}

function isRealImage(file) {
  const b = file.buffer;
  if (!b || b.length < 12) return false;
  if (file.mimetype === 'image/png') return b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (file.mimetype === 'image/webp') return b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

function parseModelJson(raw) {
  const cleaned = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
    }
  }
  return {
    summary: 'Here are some suggestions:',
    replies: cleaned.split('\n').filter(Boolean).slice(0, 8).map((line, i) => ({ label: `Option ${i + 1}`, text: line.replace(/^[-*\d.)\s]+/, '') }))
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider: 'groq',
    configured: Boolean(process.env.GROQ_API_KEY),
    textModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    visionModel: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b'
  });
});

app.post('/api/generate', upload.array('screenshots', MAX_IMAGES), async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'RIZZLY AI is not configured. Add GROQ_API_KEY to your environment variables and redeploy.' });

    const task = safeText(req.body?.task, 30) || 'reply';
    const allowedTasks = ['rizz', 'reply', 'starters', 'translate', 'wingman', 'pickup', 'scanner'];
    if (!allowedTasks.includes(task)) return res.status(400).json({ error: 'Unknown RIZZLY tool.' });
    const files = req.files || [];
    if (task === 'scanner' && files.length === 0) return res.status(400).json({ error: 'Upload at least one screenshot to scan.' });
    if (task !== 'scanner' && files.length) return res.status(400).json({ error: 'Screenshots are only accepted by the chat scanner.' });
    if (files.some(file => !isRealImage(file))) return res.status(400).json({ error: 'One of the uploaded files is not a valid image.' });

    const userText = `${taskPrompt(task, req.body || {})}\n\nReturn valid JSON only. Use this shape: {"summary":"...","mood":"...","latestMessage":"...","caveat":"...","replies":[{"label":"...","text":"..."}]}. Include only relevant optional fields. Do not wrap JSON in Markdown.`;
    let content = userText;
    if (task === 'scanner') {
      content = [{ type: 'text', text: userText }];
      for (const file of files) {
        content.push({
          type: 'image_url',
          image_url: { url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}` }
        });
      }
    }

    const model = task === 'scanner'
      ? (process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b')
      : (process.env.GROQ_MODEL || 'openai/gpt-oss-20b');

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content }
        ],
        max_completion_tokens: 1600
      }),
      signal: AbortSignal.timeout(55000)
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const providerMessage = payload?.error?.message || 'The AI provider returned an error.';
      if (upstream.status === 401) return res.status(502).json({ error: 'Groq rejected the API key. Check GROQ_API_KEY in your Vercel environment variables.' });
      if (upstream.status === 429) return res.status(429).json({ error: 'Groq rate limit or free-tier quota reached. Wait and try again later, or check your Groq console limits.' });
      if (upstream.status === 400 && task === 'scanner') return res.status(502).json({ error: `The selected Groq vision model could not process this image request. Check GROQ_VISION_MODEL and model access. Details: ${providerMessage}` });
      return res.status(502).json({ error: `Groq API error: ${providerMessage}` });
    }

    const raw = payload?.choices?.[0]?.message?.content;
    if (!raw) return res.status(502).json({ error: 'Groq returned an empty response. Please try again.' });
    const result = parseModelJson(raw);
    if (!Array.isArray(result.replies)) result.replies = [];
    result.replies = result.replies
      .filter(item => item && typeof item.text === 'string' && item.text.trim())
      .slice(0, 8)
      .map(item => ({ label: safeText(item.label, 80) || 'Suggestion', text: safeText(item.text, 1200) }));
    res.json(result);
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return res.status(504).json({ error: 'The AI request took too long. Please try again.' });
    res.status(500).json({ error: 'Something went wrong while generating your result. Please try again.' });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Each screenshot must be 1 MB or smaller after optimization.' });
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: `Upload no more than ${MAX_IMAGES} screenshots at once.` });
  res.status(400).json({ error: err.message || 'Invalid request.' });
});

export default app;
