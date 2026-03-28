import 'dotenv/config';
import express from 'express';

const app = express();
const port = 8787;
const serverApiKey = process.env.OPENAI_API_KEY?.trim() ?? '';

app.use(express.json({ limit: '2mb' }));

app.get('/api/config', (_req, res) => {
  return res.json({
    hasServerApiKey: Boolean(serverApiKey)
  });
});

app.post('/api/chat', async (req, res) => {
  const { apiKey, messages, instructions } = req.body ?? {};
  const resolvedApiKey =
    typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : serverApiKey;

  if (!resolvedApiKey) {
    return res.status(400).json({
      error: 'An OpenAI API key is required. Add one in Customize or set OPENAI_API_KEY before starting the server.'
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'At least one message is required.' });
  }

  const trimmedInstructions =
    typeof instructions === 'string' ? instructions.trim() : '';

  const requestMessages = [
    ...(trimmedInstructions
      ? [{ role: 'system', content: trimmedInstructions }]
      : []),
    ...messages.map((message) => {
      const imageParts = Array.isArray(message.images)
        ? message.images
            .filter(
              (image) =>
                image &&
                typeof image.dataUrl === 'string' &&
                typeof image.mimeType === 'string' &&
                image.mimeType.startsWith('image/')
            )
            .map((image) => ({
              type: 'image_url',
              image_url: {
                url: image.dataUrl
              }
            }))
        : [];

      if (imageParts.length > 0) {
        return {
          role: message.role,
          content: [
            ...(typeof message.content === 'string' && message.content.trim()
              ? [
                  {
                    type: 'text',
                    text: message.content
                  }
                ]
              : []),
            ...imageParts
          ]
        };
      }

      return {
        role: message.role,
        content: message.content
      };
    })
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: requestMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ?? 'OpenAI returned an unexpected error.';

      return res.status(response.status).json({ error: errorMessage });
    }

    const text = data?.choices?.[0]?.message?.content;

    if (typeof text !== 'string' || !text.trim()) {
      return res
        .status(502)
        .json({ error: 'The model response was empty or unreadable.' });
    }

    return res.json({ reply: text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to reach OpenAI.';

    return res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(
    `4o chat server running on http://localhost:${port}${serverApiKey ? ' with server API key mode enabled' : ''}`
  );
});
