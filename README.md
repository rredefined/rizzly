# RIZZLY — Your Personal AI Wingman

**Never Run Out of Rizz.** An AI-powered texting assistant for natural replies, conversation ideas, and chat screenshot insights.

- Live preview: https://rizz.rekaixp.cyou
- Developer: Rekaixp
- AI provider: Groq
- Deployment: Vercel

## Premium Glass UI

RIZZLY uses a refined dark glass interface: translucent layered panels, subtle violet ambient lighting, restrained gradients, thin borders, clean typography, responsive layouts, and reduced-motion support. The visual system is consistent across the overview, tool workspace, results, saved replies, history, and settings.

## Features

- AI Rizz Generator
- Chat Screenshot Scanner (up to 3 images per request, subject to model limits)
- AI Reply Assistant
- Conversation Starters
- Rizz Translator
- AI Wingman
- Pickup Lines & Bios
- Saved replies and history in browser LocalStorage
- No signup or login required

## Tech Stack

- React 18 + Vite
- JavaScript and CSS
- Express API
- Groq Chat Completions API
- Groq vision model for screenshot analysis
- Vercel deployment
- LocalStorage for browser-side saved data

## Models

Default model configuration:

| Purpose | Model |
| --- | --- |
| Text tools | `openai/gpt-oss-20b` |
| Screenshot scanner | `qwen/qwen3.8-27b` |

Model availability and free-tier limits are controlled by Groq and may change. See [Groq models](https://console.groq.com/docs/models) and [Groq vision](https://console.groq.com/docs/vision).

## Run Locally

1. Install Node.js 20 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and add your Groq API key.

   Windows CMD:

   ```cmd
   copy .env.example .env
   ```

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Create a production build:

   ```bash
   npm run build
   ```

Vite serves the frontend and proxies `/api` requests to the local Express server on port `8787`.

## Environment Variables

```env
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=openai/gpt-oss-20b
GROQ_VISION_MODEL=qwen/qwen3.8-27b
PORT=8787
```

Create API keys in the [Groq Console](https://console.groq.com/keys). Never commit `.env` or expose the API key in frontend code. Free-tier availability and rate limits are not guaranteed and can change.

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. Import the repository at [Vercel](https://vercel.com/new).
3. Use `npm run build` as the build command.
4. Set the output directory to `public` (also configured in `vercel.json`).
5. Add `GROQ_API_KEY`, `GROQ_MODEL`, and `GROQ_VISION_MODEL` under Project Settings → Environment Variables.
6. Redeploy after changing environment variables.

Health check: `/api/health`. It reports whether a key is configured; it does not validate the key or model access.

## Privacy

- No account is required.
- Saved replies, history, and preferences are stored in the current browser's LocalStorage.
- Screenshots are sent to the configured backend for analysis and are not stored in a public gallery.
- Only upload conversations and images you have permission to share.
- Keep API keys on the server and out of source control.

## Credits

Crafted with care by **Rekaixp**.
