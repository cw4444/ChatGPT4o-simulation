# Developer Notes

This file is for setup, configuration, and deployment details.

## Local Development

1. Install Node.js.
2. Install dependencies.
3. Start the app.

```bash
npm install
npm run dev
```

Open [http://localhost:5180](http://localhost:5180).

## API Key Options

### Browser key mode

Paste your OpenAI API key into the `Customize` panel. The key stays in that browser on that machine.

### Server key mode

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
