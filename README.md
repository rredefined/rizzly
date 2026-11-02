# 💜 RIZZLY — Your Personal AI Wingman

<p align="center">
  <strong>Never Run Out of Rizz.</strong><br />
  An AI-powered texting assistant for natural replies, conversation ideas, and chat screenshot insights.
</p>

<p align="center">
  <a href="https://rizz.rekaixp.cyou"><img src="https://img.shields.io/badge/Live%20Preview-rizz.rekaixp.cyou-A855F7?style=for-the-badge" alt="Live preview" /></a>
  <img src="https://img.shields.io/badge/Developer-Rekaixp-A855F7?style=for-the-badge" alt="Developer Rekaixp" />
  <img src="https://img.shields.io/badge/AI-Groq-F55036?style=for-the-badge" alt="Groq AI" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge" alt="Vercel" />
</p>

## 🌐 Live Preview

**Try RIZZLY:** [https://rizz.rekaixp.cyou](https://rizz.rekaixp.cyou)

RIZZLY does not require signup or login. Saved replies, history, and preferences are stored in the current browser using LocalStorage.

## ✨ Features

- **AI Rizz Generator** — Generate natural, playful, funny, sweet, or confident messages.
- **Chat Screenshot Scanner** — Upload up to 3 chat screenshots for vision-based conversation analysis and reply ideas.
- **AI Reply Assistant** — Paste a message and get several possible responses.
- **Conversation Starters** — Get non-generic conversation openers.
- **Rizz Translator** — Rewrite messages in different tones and languages.
- **AI Wingman** — Get practical advice for a texting situation.
- **Pickup Lines & Bios** — Generate lighthearted lines and profile bio ideas.
- **Saved Replies & History** — Keep useful suggestions in the browser.
- **No account required** — Open the site and use the tools.

## 🧰 Tech Stack

- React 18 + Vite
- JavaScript
- CSS
- Express API
- Groq Chat Completions API
- Groq vision model for screenshot analysis
- Vercel deployment
- LocalStorage for browser-side saved data

## 🤖 Groq Models

The default configuration uses:

| Purpose | Model |
|---|---|
| Text tools | `openai/gpt-oss-20b` |
| Screenshot scanner | `qwen/qwen3.8-27b` |

Model access, availability, and free-tier limits are controlled by Groq and can change. Check the [Groq model documentation](https://console.groq.com/docs/models) and [Vision documentation](https://console.groq.com/docs/vision) if a model is unavailable.

## 🚀 Run Locally

### 1. Download or clone the repository

```bash
git clone https://github.com/rredefined/rizzly.git
cd rizzly
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment

Copy `.env.example` to `.env` and add your own Groq API key.

**Windows CMD:**

```cmd
copy .env.example .env
```

**PowerShell:**

```powershell
Copy-Item .env.example .env
```

Edit `.env`:

```env
GROQ_API_KEY=gsk_your_real_key_here
GROQ_MODEL=openai/gpt-oss-20b
GROQ_VISION_MODEL=qwen/qwen3.8-27b
PORT=8787
```

Create/manage API keys in the [Groq Console](https://console.groq.com/keys). API usage is subject to the provider's current rate limits and account terms. A free tier, where offered, is not unlimited and may change.

### 4. Start the development servers

```bash
npm run dev
```

Vite serves the frontend and proxies `/api` requests to the local Express server on port `8787`.

### 5. Production build

```bash
npm run build
```

The Vite build is written to `public/` for Vercel deployment.

## ☁️ Deploy to Vercel

1. Push the project to a GitHub repository.
2. Import that repository in [Vercel](https://vercel.com/new).
3. Keep the build command as `npm run build`.
4. Set the output directory to `public` (also configured in `vercel.json`).
5. Add these environment variables in **Project → Settings → Environment Variables**:

   | Name | Value |
   |---|---|
   | `GROQ_API_KEY` | Your private Groq API key |
   | `GROQ_MODEL` | `openai/gpt-oss-20b` |
   | `GROQ_VISION_MODEL` | `qwen/qwen3.8-27b` |

6. Redeploy after adding or changing environment variables.

### Health check

After deployment, visit:

```text
https://YOUR_DOMAIN/api/health
```

The response reports whether the server has a Groq key configured. It does **not** verify that the key is valid or that the selected models are enabled.

## 🔐 Security & Privacy

- Keep `GROQ_API_KEY` on the server. Never prefix it with `VITE_`.
- Never commit `.env` to GitHub. `.gitignore` excludes it; commit `.env.example` instead.
- Screenshot uploads are held in memory for the request and are not written to a project storage bucket by this app.
- Only upload conversations you have permission to share. Avoid uploading sensitive personal information.
- LocalStorage data stays in that browser profile and is not synced between devices.
- The included in-memory rate limiter is a basic safeguard, not a distributed production abuse-prevention system.

## 📸 Screenshots

Add screenshots of the homepage, tool workspace, screenshot scanner, and saved replies here.

## 👨‍💻 Developer

**RIZZLY is developed by Rekaixp.**

- Product: RIZZLY
- Tagline: Never Run Out of Rizz.
- Live preview: [rizz.rekaixp.cyou](https://rizz.rekaixp.cyou)

---

<p align="center">
  <strong>RIZZLY</strong><br />
  Never Run Out of Rizz.<br /><br />
  Made with care by <strong>Rekaixp</strong> 💜
</p>
