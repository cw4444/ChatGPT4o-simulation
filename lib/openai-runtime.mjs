const DEFAULT_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4o';

function getServerApiKey() {
  return process.env.OPENAI_API_KEY?.trim() || '';
}

export function getPublicConfig() {
  return {
    hasServerApiKey: Boolean(getServerApiKey()),
    model: DEFAULT_MODEL,
    appName: '4o Chat Studio'
  };
}

function buildRequestMessages(messages, instructions) {
  const trimmedInstructions =
    typeof instructions === 'string' ? instructions.trim() : '';

  return [
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
}

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function resolveRuntimeOptions(settings) {
  const personality =
    settings && typeof settings === 'object' && settings.personality
      ? settings.personality
      : {};
  const verbosity = clampNumber(settings?.verbosity, 52, 0, 100);
  const chaos = clampNumber(personality.chaos, 12, 0, 100);
  const snark = clampNumber(personality.snark, 16, 0, 100);
  const flirty = clampNumber(personality.flirty, 18, 0, 100);
  const patient = clampNumber(personality.patient, 72, 0, 100);

  const temperature = Math.min(
    1.05,
    Math.max(0.35, 0.45 + chaos * 0.004 + snark * 0.0015 + flirty * 0.001 - patient * 0.001)
  );

  const maxTokens = verbosity <= 24 ? 500 : verbosity >= 75 ? 1800 : 950;

  return {
    temperature: Number(temperature.toFixed(2)),
    max_tokens: maxTokens
  };
}

export async function createChatReply({ apiKey, messages, instructions, settings }) {
  const resolvedApiKey =
    typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : getServerApiKey();

  if (!resolvedApiKey) {
    return {
      status: 400,
      body: {
        error:
          'An OpenAI API key is required. Add one in Customize or set OPENAI_API_KEY before starting the server.'
      }
    };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      status: 400,
      body: { error: 'At least one message is required.' }
    };
  }

  const requestMessages = buildRequestMessages(messages, instructions);
  const runtimeOptions = resolveRuntimeOptions(settings);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedApiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: requestMessages,
        ...runtimeOptions
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        body: {
          error: data?.error?.message ?? 'OpenAI returned an unexpected error.'
        }
      };
    }

    const text = data?.choices?.[0]?.message?.content;

    if (typeof text !== 'string' || !text.trim()) {
      return {
        status: 502,
        body: { error: 'The model response was empty or unreadable.' }
      };
    }

    return {
      status: 200,
      body: {
        reply: text,
        model: DEFAULT_MODEL
      }
    };
  } catch (error) {
    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : 'Unable to reach OpenAI.'
      }
    };
  }
}
