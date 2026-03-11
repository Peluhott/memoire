import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

type ContentItem = {
  id: number
  title: string
  description: string
  type: string
  resource_type: string
  public_id: string
  shared_with_network: boolean
  uploaded_at: string
}

type ContentCard = ContentItem & {
  signedUrl?: string
}

function App() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [revokedToken, setRevokedToken] = useState('')
  const [status, setStatus] = useState('Ready to create a user or log in.')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingUploads, setIsLoadingUploads] = useState(false)
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<'auth' | 'uploads' | 'upload'>('auth')
  const [contentItems, setContentItems] = useState<ContentCard[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, init)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message ?? data.error ?? 'Request failed')
    }

    return data as T
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('Creating user...')

    try {
      await fetchJson('/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      })

      setStatus('User created. You can now log in with the same username and password.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'User creation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('Logging in...')

    try {
      const data = await fetchJson<{ token: string }>('/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      setToken(data.token)
      setRevokedToken('')
      setActiveView('uploads')
      setStatus('Login succeeded. Loading your uploads...')
      await loadUploads(data.token)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function logout(currentToken: string, mode: 'active' | 'revoked') {
    setIsSubmitting(true)
    setStatus(mode === 'active' ? 'Logging out...' : 'Verifying revoked token...')

    try {
      await fetchJson('/user/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })

      if (mode === 'active') {
        setRevokedToken(currentToken)
        setToken('')
        setContentItems([])
        setActiveView('auth')
        setStatus('Logout succeeded. Use "Verify Revoked Token" to confirm the old token no longer works.')
      } else {
        setStatus('Revoked token unexpectedly still worked.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed'

      if (mode === 'revoked') {
        setStatus(`Revoked token rejected as expected: ${message}`)
      } else {
        setStatus(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function loadUploads(authToken = token) {
    if (!authToken) return

    setIsLoadingUploads(true)

    try {
      const items = await fetchJson<ContentItem[]>('/content', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      const withUrls = await Promise.all(
        items.map(async (item) => {
          try {
            const signed = await fetchJson<{ url: string }>(`/content/${item.id}/url`, {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            })

            return { ...item, signedUrl: signed.url }
          } catch {
            return { ...item }
          }
        }),
      )

      setContentItems(withUrls)
      setStatus(items.length > 0 ? 'Uploads loaded.' : 'No uploads yet. Add your first memory.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load uploads')
    } finally {
      setIsLoadingUploads(false)
    }
  }

  async function uploadContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setStatus('Login required before uploading.')
      return
    }

    if (!file) {
      setStatus('Choose an image file before uploading.')
      return
    }

    setIsSubmitting(true)
    setStatus('Uploading memory...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('description', description)

      await fetchJson('/content', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      setTitle('')
      setDescription('')
      setFile(null)
      setActiveView('uploads')
      await loadUploads(token)
      setStatus('Upload complete.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function sendTestEmail() {
    if (!token) {
      setStatus('Login required before sending a test email.')
      return
    }

    setIsSubmitting(true)
    setStatus('Sending test email...')

    try {
      await fetchJson('/deliveries/test-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setStatus('Test email sent.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send test email')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function sendImageEmail(item: ContentCard) {
    if (!token) {
      setStatus('Login required before sending an image email.')
      return
    }

    setSendingEmailId(item.id)
    setStatus(`Sending generated email for "${item.title}"...`)

    try {
      await fetchJson('/deliveries/generated-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
        }),
      })

      setStatus(`Generated email sent for "${item.title}".`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send generated email')
    } finally {
      setSendingEmailId(null)
    }
  }

  const hasActiveToken = token.length > 0
  const hasRevokedToken = revokedToken.length > 0

  return (
    <main className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Memoire v1</p>
        <h1>Login, browse uploads, and add new memories</h1>
        <p className="hero-copy">
          This small client talks directly to the existing backend so you can create
          an account, log in, review uploaded memories, and add more content.
        </p>
        <dl className="meta-grid">
          <div>
            <dt>API base</dt>
            <dd>{API_BASE_URL}</dd>
          </div>
          <div>
            <dt>Flow</dt>
            <dd>Create user -&gt; Login -&gt; My uploads -&gt; Upload memory</dd>
          </div>
        </dl>
      </section>

      <section className="panel nav-panel">
        <div className="tab-row">
          <button
            className={activeView === 'auth' ? 'tab-button is-active' : 'tab-button'}
            type="button"
            onClick={() => setActiveView('auth')}
          >
            Auth
          </button>
          <button
            className={activeView === 'uploads' ? 'tab-button is-active' : 'tab-button'}
            disabled={!hasActiveToken}
            type="button"
            onClick={() => {
              setActiveView('uploads')
              void loadUploads()
            }}
          >
            My Uploads
          </button>
          <button
            className={activeView === 'upload' ? 'tab-button is-active' : 'tab-button'}
            disabled={!hasActiveToken}
            type="button"
            onClick={() => setActiveView('upload')}
          >
            Upload
          </button>
        </div>
      </section>

      {activeView === 'auth' && (
        <section className="panel">
          <div className="form-stack">
            <form className="auth-form" onSubmit={createUser}>
              <p className="section-heading">Create user</p>

              <label>
                <span>Email</span>
                <input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="enter an email"
                />
              </label>

              <label>
                <span>Username</span>
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="enter a username"
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  autoComplete="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="enter a password"
                />
              </label>

              <div className="action-row">
                <button disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Working...' : 'Create User'}
                </button>
              </div>
            </form>

            <div className="divider" aria-hidden="true" />

            <form className="auth-form" onSubmit={login}>
              <p className="section-heading">Login</p>

              <label>
                <span>Username</span>
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="enter a username"
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="enter a password"
                />
              </label>

              <div className="action-row">
                <button disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Working...' : 'Login'}
                </button>
                <button
                  disabled={isSubmitting || !hasActiveToken}
                  type="button"
                  onClick={() => void logout(token, 'active')}
                >
                  Logout
                </button>
                <button
                  className="ghost-button"
                  disabled={isSubmitting || !hasRevokedToken}
                  type="button"
                  onClick={() => void logout(revokedToken, 'revoked')}
                >
                  Verify Revoked Token
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {activeView === 'uploads' && (
        <section className="panel">
          <div className="section-head">
            <div>
              <p className="section-heading">My uploads</p>
              <p className="section-subcopy">Signed previews are requested for each item when possible.</p>
            </div>
            <div className="action-row">
              <button
                disabled={isSubmitting || !hasActiveToken}
                type="button"
                onClick={() => void sendTestEmail()}
              >
                {isSubmitting ? 'Working...' : 'Send Test Email'}
              </button>
              <button
                className="ghost-button"
                disabled={isLoadingUploads || !hasActiveToken}
                type="button"
                onClick={() => void loadUploads()}
              >
                {isLoadingUploads ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {contentItems.length === 0 ? (
            <div className="empty-state">
              <p>No uploads found for this account yet.</p>
              <button type="button" onClick={() => setActiveView('upload')}>
                Upload a memory
              </button>
            </div>
          ) : (
            <div className="uploads-grid">
              {contentItems.map((item) => (
                <article className="upload-card" key={item.id}>
                  {item.signedUrl ? (
                    <img alt={item.title} className="upload-image" src={item.signedUrl} />
                  ) : (
                    <div className="image-fallback">No preview available</div>
                  )}
                  <div className="upload-copy">
                    <h2>{item.title}</h2>
                    <p>{item.description || 'No description provided.'}</p>
                    <div className="action-row">
                      <button
                        disabled={sendingEmailId === item.id || isSubmitting || !hasActiveToken}
                        type="button"
                        onClick={() => void sendImageEmail(item)}
                      >
                        {sendingEmailId === item.id ? 'Sending...' : 'Send Email'}
                      </button>
                    </div>
                    {item.signedUrl ? (
                      <a
                        className="signed-link"
                        href={item.signedUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open signed image
                      </a>
                    ) : null}
                    <dl className="upload-meta">
                      <div>
                        <dt>Type</dt>
                        <dd>{item.type}</dd>
                      </div>
                      <div>
                        <dt>Uploaded</dt>
                        <dd>{new Date(item.uploaded_at).toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeView === 'upload' && (
        <section className="panel">
          <form className="auth-form" onSubmit={uploadContent}>
            <p className="section-heading">Upload content</p>
            <p className="section-subcopy">This uses the current multipart `/content` endpoint.</p>

            <label>
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="give this memory a title"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                className="text-area"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="describe the memory"
              />
            </label>

            <label>
              <span>Image file</span>
              <input
                accept="image/*"
                className="file-input"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <div className="action-row">
              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Uploading...' : 'Upload Memory'}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setActiveView('uploads')
                  void loadUploads()
                }}
              >
                Back to uploads
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel status-panel">
        <div>
          <p className="section-label">Status</p>
          <p className="status-copy">{status}</p>
        </div>

        <div className="token-grid">
          <article>
            <p className="section-label">Active token</p>
            <code>{hasActiveToken ? token : 'none'}</code>
          </article>
          <article>
            <p className="section-label">Last revoked token</p>
            <code>{hasRevokedToken ? revokedToken : 'none'}</code>
          </article>
        </div>
      </section>
    </main>
  )
}

export default App
