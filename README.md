# 4o Chat Studio

4o Chat Studio is a small chat app with image uploads, saved chat history, and optional personality controls.

Concept by Charli. Heavy lifting by Codex.

## Start Here

If you want to use the app:

1. Open the app.
2. Click `Customize`.
3. Add your OpenAI API key if you have one.
4. Pick a preset or move the sliders.
5. Start chatting.

If a key was saved in that browser before, it should still be there. If not, just add a new one.

## Running It Locally

If you want to run the app yourself:

1. Install the dependencies.

```bash
npm install
```

2. Start the app.

```bash
npm run dev
```

3. Open [http://localhost:5180](http://localhost:5180).

If you want the setup details, deployment notes, or technical bits, see [DEV.md](DEV.md).

## Tiny Notes

- default model: `gpt-4o`
- chat history is stored in your browser
- image attachments are limited to 3 per message
- each image must be under 8MB

## License

This project is proprietary. You may not use, copy, modify, redistribute, deploy, or install it for commercial or client use without prior written permission.

Commercial licenses are available. For business use, professional installation, or deployment enquiries, contact: **cw4444@gmail.com**
