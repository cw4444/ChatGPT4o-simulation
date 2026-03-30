import 'dotenv/config';
import express from 'express';
import { createChatReply, getPublicConfig } from './lib/openai-runtime.mjs';

const app = express();
const port = 8787;

app.use(express.json({ limit: '2mb' }));

app.get('/api/config', (_req, res) => {
  return res.json(getPublicConfig());
});

app.post('/api/chat', async (req, res) => {
  const result = await createChatReply(req.body ?? {});
  return res.status(result.status).json(result.body);
});

app.listen(port, () => {
  const { hasServerApiKey } = getPublicConfig();
  console.log(
    `4o chat server running on http://localhost:${port}${hasServerApiKey ? ' with server API key mode enabled' : ''}`
  );
});
