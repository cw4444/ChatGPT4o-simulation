# 4o Chat Studio

4o Chat Studio is a small chat app with a clean interface, multi-thread history, image uploads, and optional assistant personality controls.

This version was built entirely by Codex. The human role was limited to snacks, vibes, and delighted testing.

## What It Does

- lets you chat with OpenAI models
- saves chat threads in your browser
- supports image uploads in messages
- lets you set a browser-saved API key or use a server-side key
- lets you tune the assistant's personality and response length

## Run It Locally

1. Install the dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open [http://localhost:5180](http://localhost:5180)

## API Key Setup

### Option 1: Save a key in the app

Open the `Customize` panel and paste your OpenAI API key there. It stays in that browser on that machine.

### Option 2: Use a server-side key

Copy `.env.example` to `.env` and add your key:

```env
OPENAI_API_KEY=sk-your-real-key-here
```

Then run the app normally with `npm run dev`.

When `OPENAI_API_KEY` is set, the app can send requests through the local or hosted server without exposing the key to the browser.

## Hosted Setup

If you deploy this to Vercel, the frontend builds from Vite and the API routes live in `api/chat.js` and `api/config.js`.

If you want server-side key mode on the hosted app, add `OPENAI_API_KEY` in your Vercel environment variables.

## Notes

- default model: `gpt-4o`
- chat history is stored in local browser storage
- image attachments are limited to 3 per message
- each image must be under 8MB

## License

This project is proprietary. You may not use, copy, modify, redistribute, deploy, or install it for commercial or client use without prior written permission.

Commercial licenses are available. For business use, professional installation, or deployment enquiries, contact: **cw4444@gmail.com**
