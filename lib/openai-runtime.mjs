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

export async function createChatReply({ apiKey, messages, instructions }) {
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

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedApiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: requestMessages
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
