import { createChatReply } from '../lib/openai-runtime.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const result = await createChatReply(req.body ?? {});
  return res.status(result.status).json(result.body);
}
