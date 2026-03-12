import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
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
  const [status, setStatus] = useState('Log in to view your memories.')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingUploads, setIsLoadingUploads] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [contentItems, setContentItems] = useState<ContentCard[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const isLoggedIn = token.length > 0

  async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, init)
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message ?? data.error ?? 'Request failed')
    }

    return data as T
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('Creating your account...')

    try {
      await fetchJson('/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      })

      setStatus('Account created. Log in with the same username and password.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'User creation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function login() {
    setIsSubmitting(true)
    setStatus('Logging in...')

    try {
      const data = await fetchJson<{ token: string }>('/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      setToken(data.token)
      setStatus('Login succeeded. Loading memories...')
      await loadUploads(data.token)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function logout() {
    if (!token) {
      setStatus('Login required.')
      return
    }

    setIsSubmitting(true)
    setStatus('Logging out...')

    try {
      await fetchJson('/user/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      setToken('')
      setContentItems([])
      setIsUploadOpen(false)
      setStatus('Logged out.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Logout failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function loadUploads(authToken = token) {
    if (!authToken) {
      return
    }

    setIsLoadingUploads(true)

    try {
      const items = await fetchJson<ContentItem[]>('/content', {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      const withUrls = await Promise.all(
        items.map(async (item) => {
          try {
            const signed = await fetchJson<{ url: string }>(`/content/${item.id}/url`, {
              headers: { Authorization: `Bearer ${authToken}` },
            })

            return { ...item, signedUrl: signed.url }
          } catch {
            return { ...item }
          }
        }),
      )

      setContentItems(withUrls)
      setStatus(withUrls.length > 0 ? 'Memories loaded.' : 'No memories yet. Upload one to get started.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load uploads')
    } finally {
      setIsLoadingUploads(false)
    }
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setStatus('Login required before uploading.')
      return
    }

    if (!file) {
      setStatus('Choose an image before uploading.')
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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      setTitle('')
      setDescription('')
      setFile(null)
      setIsUploadOpen(false)
      await loadUploads(token)
      setStatus('Memory uploaded.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function sendImageEmail(item: ContentCard) {
    if (!token) {
      setStatus('Login required before sending an email.')
      return
    }

    setSendingEmailId(item.id)
    setStatus(`Sending email for "${item.title}"...`)

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
          publicId: item.public_id,
          resourceType: item.resource_type,
        }),
      })

      setStatus(`Generated email sent for "${item.title}".`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send generated email')
    } finally {
      setSendingEmailId(null)
    }
  }

  async function removeContent(item: ContentCard) {
    if (!token) {
      setStatus('Login required before deleting.')
      return
    }

    setDeletingId(item.id)
    setStatus(`Deleting "${item.title}"...`)

    try {
      await fetchJson(`/content/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      setContentItems((current) => current.filter((entry) => entry.id !== item.id))
      setStatus(`Deleted "${item.title}".`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button disabled={isLoggedIn || isSubmitting} type="button" onClick={() => void login()}>
          Login
        </button>
        <p className="brand">Memoire</p>
        <button
          className="ghost-button"
          disabled={!isLoggedIn || isSubmitting}
          type="button"
          onClick={() => void logout()}
        >
          Logout
        </button>
      </header>

      <main className="layout">
        <section className="hero-card">
          <p className="eyebrow">Memory delivery</p>
          <h1>Your memories, one place.</h1>
          <p className="hero-copy">
            Log in, review your uploaded photos, send yourself a generated email, and delete the ones you no longer want to keep.
          </p>
          <p className="status-line">{status}</p>
        </section>

        <section className="auth-card">
          <div className="auth-columns">
            <form className="auth-form" onSubmit={createUser}>
              <h2>Create account</h2>
              <label>
                <span>Email</span>
                <input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                <span>Username</span>
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  autoComplete="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Working...' : 'Create Account'}
              </button>
            </form>

            <section className="auth-form login-panel">
              <h2>Login</h2>
              <label>
                <span>Username</span>
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <button disabled={isSubmitting} type="button" onClick={() => void login()}>
                {isSubmitting ? 'Working...' : 'Login'}
              </button>
            </section>
          </div>
        </section>

        <section className="memories-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Main page</p>
              <h2>Uploads</h2>
            </div>
            <div className="toolbar">
              <button
                disabled={!isLoggedIn || isSubmitting}
                type="button"
                onClick={() => setIsUploadOpen((current) => !current)}
              >
                {isUploadOpen ? 'Close Upload' : 'Upload'}
              </button>
              <button
                className="ghost-button"
                disabled={!isLoggedIn || isLoadingUploads}
                type="button"
                onClick={() => void loadUploads()}
              >
                {isLoadingUploads ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {isUploadOpen ? (
            <form className="upload-form" onSubmit={submitUpload}>
              <label>
                <span>Title</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label>
                <span>Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
              <label>
                <span>Photo</span>
                <input accept="image/*" type="file" onChange={handleFileChange} />
              </label>
              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Uploading...' : 'Save Memory'}
              </button>
            </form>
          ) : null}

          {!isLoggedIn ? (
            <div className="empty-state">
              <p>Log in to view your uploads.</p>
            </div>
          ) : contentItems.length === 0 ? (
            <div className="empty-state">
              <p>No uploads yet.</p>
            </div>
          ) : (
            <div className="memory-grid">
              {contentItems.map((item) => (
                <article className="memory-card" key={item.id}>
                  {item.signedUrl ? (
                    <img alt={item.title} className="memory-image" src={item.signedUrl} />
                  ) : (
                    <div className="memory-fallback">No preview</div>
                  )}
                  <div className="memory-copy">
                    <h3>{item.title}</h3>
                    <p>{item.description || 'No description provided.'}</p>
                    <div className="memory-meta">
                      <span>{item.type}</span>
                      <span>{new Date(item.uploaded_at).toLocaleDateString()}</span>
                    </div>
                    <div className="memory-actions">
                      <button
                        disabled={sendingEmailId === item.id || deletingId === item.id}
                        type="button"
                        onClick={() => void sendImageEmail(item)}
                      >
                        {sendingEmailId === item.id ? 'Sending...' : 'Generate Email'}
                      </button>
                      <button
                        className="ghost-button danger-button"
                        disabled={deletingId === item.id || sendingEmailId === item.id}
                        type="button"
                        onClick={() => void removeContent(item)}
                      >
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
