# RIZZLY — Your Personal AI Wingman

**Never Run Out of Rizz.**

RIZZLY is an AI-powered texting assistant for natural replies, conversation ideas, chat screenshot insights, and playful message rewrites.

- **Live preview:** https://rizz.rekaixp.cyou
- **GitHub:** https://github.com/rredefined/rizzly
- **Developer:** Rekaixp
- **AI provider:** Groq
- **Deployment:** Vercel

## Features

- **AI Rizz Generator** — generate messages in a selected tone.
- **Conversation Reply Suggester** — paste a conversation and get five context-aware reply ideas.
- **Freaky Mode** — cheeky, mischievous teasing with playful, non-explicit double meanings.
- **Midnight Mode** — soft, mysterious late-night conversation energy.
- **Chat Screenshot Scanner** — analyze supported chat screenshots and suggest replies based on visible context.
- **AI Reply Assistant** — rewrite or improve a message.
- **Conversation Starters** — get ideas for opening a conversation.
- **Rizz Translator** — rewrite messages in another language or style.
- **AI Wingman** — get help thinking through a conversation.
- **Pickup Lines & Bios** — generate playful lines and profile bio ideas.
- **Saved replies and history** — stored locally in the browser.
- **No signup or login required.**

English, Hindi, and Hinglish are supported where available in the selected tool. AI output depends on the configured Groq models and their current capabilities.

## Interface

RIZZLY uses a premium dark glass visual style with translucent panels, subtle violet lighting, restrained gradients, responsive layouts, and clean typography.

## Tech Stack

- React 18 + Vite
- JavaScript and CSS
- Express API
- Groq Chat Completions API
- Groq vision model for screenshot analysis
- Vercel deployment
- LocalStorage for browser-side saved data

## Default Models

| Purpose | Model |
| --- | --- |
| Text tools | `openai/gpt-oss-20b` |
| Screenshot scanner | `qwen/qwen3.8-27b` |

Model availability, limits, and pricing are controlled by Groq and may change. See the [Groq model documentation](https://console.groq.com/docs/models) and [Groq vision documentation](https://console.groq.com/docs/vision).

## Requirements

- Node.js 20 or newer
- npm
- A Groq API key

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/rredefined/rizzly.git
cd rizzly
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`, then add your Groq API key.

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
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=openai/gpt-oss-20b
GROQ_VISION_MODEL=qwen/qwen3.8-27b
PORT=8787
```

Create an API key in the [Groq Console](https://console.groq.com/keys).

### 4. Start the development server

```bash
npm run dev
```

The Vite development server proxies `/api` requests to the local Express API on port `8787`.

### 5. Build for production

```bash
npm run build
```

The production build is configured to output to `public/` for Vercel deployment.

## Deploy to Vercel

1. Push the project to your GitHub repository.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Set the build command to `npm run build`.
4. Set the output directory to `public` (as configured in `vercel.json`).
5. Add these environment variables in **Project Settings → Environment Variables**:

   | Variable | Value |
   | --- | --- |
   | `GROQ_API_KEY` | Your private Groq API key |
   | `GROQ_MODEL` | `openai/gpt-oss-20b` |
   | `GROQ_VISION_MODEL` | `qwen/qwen3.8-27b` |

6. Redeploy after adding or changing environment variables.

### Health check

After deployment, open:

```text
https://YOUR_DOMAIN/api/health
```

The health endpoint reports whether a Groq key is configured. It does not confirm that the key is valid or that the selected models are enabled.

## Security & Privacy

- Never commit `.env` or expose your Groq API key in frontend code.
- Configure secrets as server-side environment variables in Vercel.
- Saved replies, history, and preferences are stored in the current browser's LocalStorage.
- Chat screenshots are sent to the configured backend for analysis. Only upload conversations and images you have permission to share.
- Review generated replies before sending them.

## Credits

Crafted with care by **Rekaixp**.
