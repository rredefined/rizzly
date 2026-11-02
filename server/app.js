import express from 'express';
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 5 },
  // Vercel exposes the raw multipart body; locally Multer reads the request stream.
  streamHandler: (req, busboy) => {
    if (req.rawBody) busboy.end(req.rawBody);
    else req.pipe(busboy);
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Upload PNG, JPG, or WEBP images only.'), allowed.includes(file.mimetype));
  }
});
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api/', rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }));

const instructions = `You are RIZZLY, a friendly texting and conversation assistant. Help users communicate naturally, confidently, and respectfully. Keep flirting light, age-appropriate, consensual, and never sexual. Never pressure someone or assume romantic interest from limited evidence. Match the requested language (English, Hindi, or natural Hinglish) and requested tone. Avoid robotic, overlong, generic replies. Do not use emojis unless requested. Return concise, useful output. When asked for multiple replies, return a JSON object with a short summary and a replies array. Each reply item should have label and text.`;

function taskPrompt(task, data) {
  const common = `Language: ${data.language || 'Hinglish'}. Tone: ${data.tone || 'Natural & casual'}. Length: ${data.length || 'Short'}. Context: ${data.context || 'Not provided'}.`;
  const prompts = {
    rizz: `Generate 5 distinct, natural message options for this situation: ${data.prompt || ''}. Who they are texting: ${data.person || 'Someone they like'}. ${common} Intensity: ${data.intensity || 'Subtle'}. Return JSON with summary and replies (label,text).`,
    reply: `Suggest 5 natural replies to this message: ${data.prompt || ''}. ${common} Reply styles should vary: natural, playful, sweet, confident, and lightly flirty where appropriate. Return JSON with summary and replies (label,text).`,
    starters: `Create 8 conversation starters for this situation/person: ${data.prompt || ''}. Interests: ${data.interests || 'Unknown'}. ${common} Avoid interview-like questions and generic openers. Return JSON with summary and replies (label,text).`,
    translate: `Rewrite this message in the selected style (${data.tone || 'Smooth'}): ${data.prompt || ''}. Language: ${data.language || 'Hinglish'}. Give 4 variations, preserving the original meaning. Return JSON with summary and replies (label,text).`,
    wingman: `Give practical texting advice and a natural next message for this situation: ${data.prompt || ''}. ${common} Be supportive, don't overinterpret. Return JSON with summary and replies (label,text).`,
    pickup: `Generate 8 lighthearted, respectful pickup lines or social bio ideas based on: ${data.prompt || ''}. Style: ${data.tone || 'Playful'}. Language: ${data.language || 'Hinglish'}. Keep it non-sexual and not pushy. Return JSON with summary and replies (label,text).`,
    scanner: `Analyze the attached chat screenshot(s). Read only what is visible. Infer speaker identity only from bubble alignment, labels, or clear context; if uncertain, say so. Respect screenshot order. Summarize the conversation, identify the latest visible message, describe the tone cautiously, and suggest 5 possible next replies. Do not claim to know what the other person secretly feels. If text is unreadable, flag it. User preferences: ${common} Reply intensity: ${data.intensity || 'Subtle'}. Return JSON with summary, mood, latestMessage, caveat, and replies (label,text).`
  };
  return prompts[task] || prompts.reply;
}

function extractText(response) {
  if (response.output_text) return response.output_text;
  const chunks = [];
  for (const item of response.output || []) for (const c of item.content || []) if (c.type === 'output_text') chunks.push(c.text);
  return chunks.join('\n');
}

app.get('/api/health', (_req, res) => res.json({ ok: true, configured: Boolean(process.env.OPENAI_API_KEY) }));
app.post('/api/generate', upload.array('screenshots', 5), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'AI is not configured yet. Add OPENAI_API_KEY to your .env file and restart the server.' });
    const task = String(req.body.task || 'reply');
    const allowedTasks = ['rizz', 'reply', 'starters', 'translate', 'wingman', 'pickup', 'scanner'];
    if (!allowedTasks.includes(task)) return res.status(400).json({ error: 'Unknown tool.' });
    const data = req.body;
    const content = [{ type: 'input_text', text: `${instructions}\n\n${taskPrompt(task, data)}\n\nReturn valid JSON only. Do not wrap it in markdown.` }];
    for (const file of req.files || []) {
      content.push({ type: 'input_image', image_url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`, detail: 'high' });
    }
    if (task === 'scanner' && !(req.files || []).length) return res.status(400).json({ error: 'Upload at least one screenshot to scan.' });
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', input: [{ role: 'user', content }], max_output_tokens: 1200 })
    });
    const payload = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: payload.error?.message || 'The AI provider returned an error.' });
    const raw = extractText(payload);
    let result;
    try { result = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
    catch { result = { summary: 'Here are some suggestions:', replies: raw.split('\n').filter(Boolean).slice(0, 8).map((text, i) => ({ label: `Option ${i + 1}`, text: text.replace(/^[-\d.)\s]+/, '') })) }; }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Something went wrong while generating your result.' });
  }
});

app.use((err, _req, res, _next) => res.status(400).json({ error: err.message || 'Invalid request.' }));
export default app;
