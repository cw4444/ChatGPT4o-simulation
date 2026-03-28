import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

type Role = 'user' | 'assistant';

type Message = {
  id: string;
  role: Role;
  content: string;
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
};

const API_KEY_STORAGE = 'gpt4o-chat-api-key';
const INSTRUCTIONS_STORAGE = 'gpt4o-chat-instructions';
const THREADS_STORAGE = 'gpt4o-chat-threads';
const ACTIVE_THREAD_STORAGE = 'gpt4o-chat-active-thread';
const LEGACY_MESSAGES_STORAGE = 'gpt4o-chat-messages';

const starterText =
  'You’re chatting with gpt-4o. Add your API key in Customize, write optional instructions for how the assistant should behave, and start talking.';

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
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [hasServerApiKey, setHasServerApiKey] = useState(false);
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
        }
      } catch {
        if (isMounted) {
          setHasServerApiKey(false);
        }
      }
    }

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  const canSend = useMemo(() => {
    return Boolean(apiKey.trim() || hasServerApiKey) && Boolean(draft.trim()) && !isSending && Boolean(activeThread);
  }, [activeThread, apiKey, draft, hasServerApiKey, isSending]);
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
    const userMessage = createMessage('user', draft.trim());
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
          messages: requestMessages.map(({ role, content }) => ({ role, content }))
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <p className="eyebrow">4o Chat</p>
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
            <p className="eyebrow">Model</p>
            <div className="model-pill">gpt-4o</div>
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
                <div className="message-content">
                  {message.content.split('\n').map((line, index) => (
                    <p key={`${message.id}-${index}`}>{line || '\u00A0'}</p>
                  ))}
                </div>
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

          <form className="composer" onSubmit={sendMessage}>
            <textarea
              ref={composerRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message gpt-4o..."
              rows={1}
            />
            <button className="send-button" type="submit" disabled={!canSend}>
              Send
            </button>
          </form>
          <p className="composer-hint">Enter sends. Shift+Enter adds a new line.</p>
        </div>
      </main>

      {settingsOpen ? (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <aside className="settings-panel" onClick={(event) => event.stopPropagation()}>
            <div className="settings-heading">
              <div>
                <p className="eyebrow">Customize</p>
                <h1>Your local 4o setup</h1>
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
                  : 'Saved locally in this browser on this machine only so users do not need to paste it each time.'}
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
                This app is designed for local use. Your chats and browser-saved key stay on your own computer, and requests are sent only to your own local server and then to OpenAI.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export default App;
