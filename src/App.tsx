import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

type Role = 'user' | 'assistant';

type Message = {
  id: string;
  role: Role;
  content: string;
  images?: UploadedImage[];
};

type ChatThread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

type AppConfig = {
  hasServerApiKey: boolean;
  model?: string;
  appName?: string;
};

type UploadedImage = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
};

const API_KEY_STORAGE = 'gpt4o-chat-api-key';
const INSTRUCTIONS_STORAGE = 'gpt4o-chat-instructions';
const THREADS_STORAGE = 'gpt4o-chat-threads';
const ACTIVE_THREAD_STORAGE = 'gpt4o-chat-active-thread';
const LEGACY_MESSAGES_STORAGE = 'gpt4o-chat-messages';

const starterText =
  '4o Chat Studio is ready. Add your API key in Customize, set optional guidance for the assistant, and start a fresh thread.';

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Some browsers or embedded contexts can block storage access.
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function createMessage(role: Role, content: string): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content
  };
}

function createImageId() {
  return crypto.randomUUID();
}

function createThread(title = 'New chat'): ChatThread {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [createMessage('assistant', starterText)]
  };
}

function getThreadTitle(messages: Message[]) {
  const firstUserMessage = messages.find((message) => message.role === 'user');

  if (!firstUserMessage) {
    return 'New chat';
  }

  const singleLine = firstUserMessage.content.replace(/\s+/g, ' ').trim();

  if (!singleLine) {
    return 'New chat';
  }

  return singleLine.length > 42 ? `${singleLine.slice(0, 42)}...` : singleLine;
}

function sortThreads(threads: ChatThread[]) {
  return [...threads].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function formatThreadDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function getInitialThreads() {
  const storedThreads = readStorage(THREADS_STORAGE);

  if (storedThreads) {
    try {
      const parsed = JSON.parse(storedThreads) as ChatThread[];

      if (Array.isArray(parsed) && parsed.length > 0) {
        return sortThreads(parsed);
      }
    } catch {
      removeStorage(THREADS_STORAGE);
    }
  }

  const legacyMessages = readStorage(LEGACY_MESSAGES_STORAGE);

  if (legacyMessages) {
    try {
      const parsed = JSON.parse(legacyMessages) as Message[];

      if (Array.isArray(parsed) && parsed.length > 0) {
        const migratedThread = createThread();

        migratedThread.messages = parsed;
        migratedThread.title = getThreadTitle(parsed);

        return [migratedThread];
      }
    } catch {
      removeStorage(LEGACY_MESSAGES_STORAGE);
    }
  }

  return [createThread()];
}

function App() {
  const [apiKey, setApiKey] = useState(() => readStorage(API_KEY_STORAGE));
  const [instructions, setInstructions] = useState(() => readStorage(INSTRUCTIONS_STORAGE));
  const [draft, setDraft] = useState('');
  const [pendingImages, setPendingImages] = useState<UploadedImage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [hasServerApiKey, setHasServerApiKey] = useState(false);
  const [modelName, setModelName] = useState('gpt-4o');
  const [appName, setAppName] = useState('4o Chat Studio');
  const [settingsOpen, setSettingsOpen] = useState(() => !readStorage(API_KEY_STORAGE));
  const [threads, setThreads] = useState<ChatThread[]>(() => getInitialThreads());
  const [activeThreadId, setActiveThreadId] = useState(() => readStorage(ACTIVE_THREAD_STORAGE));
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const sortedThreads = useMemo(() => sortThreads(threads), [threads]);
  const activeThread =
    sortedThreads.find((thread) => thread.id === activeThreadId) ?? sortedThreads[0];

  useEffect(() => {
    if (!activeThread && sortedThreads.length > 0) {
      setActiveThreadId(sortedThreads[0].id);
      return;
    }

    if (activeThread && activeThreadId !== activeThread.id) {
      setActiveThreadId(activeThread.id);
    }
  }, [activeThread, activeThreadId, sortedThreads]);

  useEffect(() => {
    writeStorage(API_KEY_STORAGE, apiKey);
  }, [apiKey]);

  useEffect(() => {
    writeStorage(INSTRUCTIONS_STORAGE, instructions);
  }, [instructions]);

  useEffect(() => {
    writeStorage(THREADS_STORAGE, JSON.stringify(threads));
    removeStorage(LEGACY_MESSAGES_STORAGE);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads]);

  useEffect(() => {
    if (activeThreadId) {
      writeStorage(ACTIVE_THREAD_STORAGE, activeThreadId);
    }
  }, [activeThreadId]);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const data = (await response.json()) as AppConfig;

        if (isMounted) {
          setHasServerApiKey(Boolean(data.hasServerApiKey));
          setModelName(data.model?.trim() || 'gpt-4o');
          setAppName(data.appName?.trim() || '4o Chat Studio');
        }
      } catch {
        if (isMounted) {
          setHasServerApiKey(false);
          setModelName('gpt-4o');
          setAppName('4o Chat Studio');
        }
      }
    }

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  const canSend = useMemo(() => {
    return (
      Boolean(apiKey.trim() || hasServerApiKey) &&
      Boolean(draft.trim() || pendingImages.length) &&
      !isSending &&
      Boolean(activeThread)
    );
  }, [activeThread, apiKey, draft, hasServerApiKey, isSending, pendingImages.length]);
  const keyModeLabel = hasServerApiKey
    ? apiKey.trim()
      ? 'Browser key active'
      : 'Server key active'
    : 'Browser key active';

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();

    if (!activeThread) {
      return;
    }

    if (!canSend) {
      if (!apiKey.trim() && !hasServerApiKey) {
        setError('Add your OpenAI API key before sending a message, or start the server with OPENAI_API_KEY set.');
        setSettingsOpen(true);
      }
      return;
    }

    const threadId = activeThread.id;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: draft.trim(),
      images: pendingImages
    };
    const requestMessages = [...activeThread.messages, userMessage];
    const updatedUserThread: ChatThread = {
      ...activeThread,
      messages: requestMessages,
      title: getThreadTitle(requestMessages),
      updatedAt: new Date().toISOString()
    };

    setThreads((current) => {
      return current.map((thread) => (thread.id === threadId ? updatedUserThread : thread));
    });

    setDraft('');
    setPendingImages([]);
    setError('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          instructions,
          messages: requestMessages.map(({ role, content, images }) => ({
            role,
            content,
            images
          }))
        })
      });

      const data = (await response.json()) as { error?: string; reply?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error ?? 'The request failed.');
      }

      setThreads((current) => {
        return current.map((thread) => {
          if (thread.id !== threadId) {
            return thread;
          }

          const assistantMessages = [
            ...thread.messages,
            createMessage('assistant', data.reply ?? '')
          ];

          return {
            ...thread,
            messages: assistantMessages,
            title: getThreadTitle(assistantMessages),
            updatedAt: new Date().toISOString()
          };
        });
      });
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsSending(false);
      composerRef.current?.focus();
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function startFreshChat() {
    const newThread = createThread();

    setThreads((current) => [newThread, ...current]);
    setActiveThreadId(newThread.id);
    setError('');
    setDraft('');
    setPendingImages([]);
    composerRef.current?.focus();
  }

  function deleteThread(threadId: string) {
    setThreads((current) => {
      if (current.length === 1) {
        const replacement = createThread();
        setActiveThreadId(replacement.id);
        return [replacement];
      }

      const remaining = current.filter((thread) => thread.id !== threadId);

      if (activeThreadId === threadId && remaining.length > 0) {
        setActiveThreadId(sortThreads(remaining)[0].id);
      }

      return remaining;
    });
  }

  function clearSavedApiKey() {
    setApiKey('');
    removeStorage(API_KEY_STORAGE);
  }

  async function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
      return;
    }

    const availableSlots = Math.max(0, 3 - pendingImages.length);
    const selectedFiles = files.slice(0, availableSlots);

    try {
      const loadedImages = await Promise.all(
        selectedFiles.map(
          (file) =>
            new Promise<UploadedImage>((resolve, reject) => {
              if (!file.type.startsWith('image/')) {
                reject(new Error(`${file.name} is not an image file.`));
                return;
              }

              if (file.size > 8 * 1024 * 1024) {
                reject(new Error(`${file.name} is larger than 8MB.`));
                return;
              }

              const reader = new FileReader();

              reader.onload = () => {
                const result = reader.result;

                if (typeof result !== 'string') {
                  reject(new Error(`Could not read ${file.name}.`));
                  return;
                }

                resolve({
                  id: createImageId(),
                  name: file.name,
                  mimeType: file.type,
                  dataUrl: result
                });
              };

              reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
              reader.readAsDataURL(file);
            })
        )
      );

      setPendingImages((current) => [...current, ...loadedImages]);
      setError('');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not load the selected image.');
    } finally {
      event.target.value = '';
    }
  }

  function removePendingImage(imageId: string) {
    setPendingImages((current) => current.filter((image) => image.id !== imageId));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <p className="eyebrow">{appName}</p>
          <p className="sidebar-copy">A lightweight multi-thread chat workspace for text and image prompts.</p>
          <button className="secondary-button wide-button" type="button" onClick={startFreshChat}>
            New chat
          </button>
        </div>

        <div className="history-list">
          {sortedThreads.map((thread) => (
            <button
              key={thread.id}
              className={`history-item ${thread.id === activeThread?.id ? 'active' : ''}`}
              type="button"
              onClick={() => {
                setActiveThreadId(thread.id);
                setError('');
              }}
            >
              <span className="history-title">{thread.title}</span>
              <span className="history-meta">{formatThreadDate(thread.updatedAt)}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button
            className="ghost-button wide-button"
            type="button"
            onClick={() => setSettingsOpen(true)}
          >
            Customize
          </button>
          {activeThread ? (
            <button
              className="danger-button wide-button"
              type="button"
              onClick={() => deleteThread(activeThread.id)}
            >
              Delete chat
            </button>
          ) : null}
        </div>
      </aside>

      <main className="chat-shell">
        <header className="topbar">
          <div className="topbar-meta">
            <p className="eyebrow">{appName}</p>
            <div className="model-pill">{modelName}</div>
            <div className="status-pill-row">
              <span className={`status-pill ${hasServerApiKey && !apiKey.trim() ? 'server' : 'browser'}`}>
                {keyModeLabel}
              </span>
            </div>
          </div>

          <div className="topbar-actions">
            <button className="ghost-button" type="button" onClick={() => setSettingsOpen(true)}>
              Customize
            </button>
            <button className="secondary-button" type="button" onClick={startFreshChat}>
              New chat
            </button>
          </div>
        </header>

        <section className="messages" aria-live="polite">
          {activeThread?.messages.map((message) => (
            <article
              key={message.id}
              className={`message-row ${message.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div className="message-card">
                <p className="message-role">{message.role === 'user' ? 'You' : '4o'}</p>
                {message.images?.length ? (
                  <div className="message-image-grid">
                    {message.images.map((image) => (
                      <figure key={image.id} className="message-image-card">
                        <img src={image.dataUrl} alt={image.name} className="message-image" />
                        <figcaption>{image.name}</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
                {message.content ? (
                  <div className="message-content">
                    {message.content.split('\n').map((line, index) => (
                      <p key={`${message.id}-${index}`}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}

          {isSending ? (
            <article className="message-row assistant">
              <div className="message-card loading-card">
                <p className="message-role">4o</p>
                <div className="typing-indicator" aria-label="Assistant is thinking">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </article>
          ) : null}

          <div ref={messagesEndRef} />
        </section>

        <div className="composer-wrap">
          {error ? <p className="error-banner">{error}</p> : null}

          {pendingImages.length ? (
            <div className="pending-images">
              {pendingImages.map((image) => (
                <div key={image.id} className="pending-image-chip">
                  <img src={image.dataUrl} alt={image.name} className="pending-image-thumb" />
                  <div className="pending-image-copy">
                    <span>{image.name}</span>
                    <button type="button" className="remove-image-button" onClick={() => removePendingImage(image.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <form className="composer" onSubmit={sendMessage}>
            <textarea
              ref={composerRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={`Message ${modelName} or add an image...`}
              rows={1}
            />
            <div className="composer-actions">
              <label className="upload-button" htmlFor="image-upload">
                Add image
              </label>
              <input
                id="image-upload"
                className="hidden-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelection}
              />
              <button className="send-button" type="submit" disabled={!canSend}>
                Send
              </button>
            </div>
          </form>
          <p className="composer-hint">Enter sends. Shift+Enter adds a new line. You can attach up to 3 images per message.</p>
        </div>
      </main>

      {settingsOpen ? (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <aside className="settings-panel" onClick={(event) => event.stopPropagation()}>
            <div className="settings-heading">
              <div>
                <p className="eyebrow">Customize</p>
                <h1>Your chat setup</h1>
              </div>
              <button className="ghost-button" type="button" onClick={() => setSettingsOpen(false)}>
                Close
              </button>
            </div>

            <div className="control-group">
              <label htmlFor="api-key">OpenAI API key</label>
              <input
                id="api-key"
                type="password"
                placeholder={hasServerApiKey ? 'Optional when server key mode is enabled' : 'sk-...'}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
              <p className="field-hint">
                {hasServerApiKey
                  ? 'A server-side key is available, so this field is optional. If you enter one here, it stays in this browser on this machine only.'
                  : 'Saved locally in this browser on this machine only so you do not need to paste it each time.'}
              </p>
              <div className="settings-actions">
                <button className="ghost-button" type="button" onClick={clearSavedApiKey}>
                  Clear saved key
                </button>
              </div>
            </div>

            <div className="control-group">
              <label htmlFor="instructions">Customize the assistant</label>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Example: Be concise, friendly, and format code in fenced blocks."
                rows={10}
              />
            </div>

            <div className="safety-note">
              <p className="safety-title">Privacy note</p>
              <p className="field-hint">
                This app keeps chat history in local browser storage. In hosted mode, requests go through a server-side proxy so an environment-stored OpenAI key never needs to ship to the client.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export default App;
