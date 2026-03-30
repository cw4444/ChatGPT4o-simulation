import { getPublicConfig } from '../lib/openai-runtime.mjs';

export default function handler(_req, res) {
  return res.status(200).json(getPublicConfig());
}
