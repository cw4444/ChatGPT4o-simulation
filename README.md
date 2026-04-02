# 4o Chat Studio

A polished GPT-4o chat demo with multi-thread history, image prompts, browser-saved sessions, and a server-side OpenAI mode for safer hosted use.

## Highlights

- clean React + Vite chat interface
- multi-thread local chat history
- image upload for visual prompts
- optional browser-saved API key mode
- server-side OpenAI proxy for local or hosted deployments
- custom assistant instructions per browser session

## Live Demo

- Demo: [four-o-chat-studio.vercel.app](https://four-o-chat-studio.vercel.app)

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5180](http://localhost:5180).

## API Key Options

### Browser key mode

Paste your OpenAI key into the `Customize` panel. The key stays in that browser on that machine.

### Server key mode

Copy `.env.example` to `.env` and add your key:

```env
OPENAI_API_KEY=sk-your-real-key-here
```

Then run the app normally:

```bash
npm run dev
```

When `OPENAI_API_KEY` is present, the app can send requests through the local or hosted server without exposing the key to the client.

## Hosted Deployment

This repo is set up for Vercel:

- the frontend builds from Vite into `dist`
- the hosted API lives in `api/chat.js` and `api/config.js`
- shared OpenAI request logic lives in `lib/openai-runtime.mjs`

Set `OPENAI_API_KEY` in Vercel project environment variables before deploying if you want server-side key mode on the public demo.

## Notes

- model default: `gpt-4o`
- chat history is stored in local browser storage
- image attachments are limited to 3 per message
- each image must be under 8MB

## License

This project is proprietary. You may not use, copy, modify, redistribute, deploy, or install it for commercial or client use without prior written permission.

Commercial licenses are available. For business use, professional installation, or deployment enquiries, contact: **cw4444@gmail.com**
