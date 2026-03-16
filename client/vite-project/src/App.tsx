import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginCreatePage from './pages/LoginCreatePage'
import ConnectionsPage from './pages/ConnectionsPage'
import ProfilePage from './pages/ProfilePage'
import type { ConnectionRecord, Memory, SafeUser } from './types'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memoireserver.mangosky-85e31bca.eastus2.azurecontainerapps.io'
const TOKEN_STORAGE_KEY = 'memoire.auth.token'

type UploadFormState = {
  title: string
  description: string
  sharedWithNetwork: boolean
  file: File | null
}

type UploadContentResponse = {
  content: Memory
  deliveryScheduled: boolean
  delivery: {
    id: number
    scheduledFor: string
    status: 'PENDING' | 'SENT' | 'FAILED' | 'INACTIVE'
  } | null
}

async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? ((await response.json()) as Record<string, unknown>) : {}

  if (!response.ok) {
    const message =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.error === 'string' && data.error) ||
      'Request failed'
    throw new Error(message)
  }

  return data as T
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [activeView, setActiveView] = useState<'home' | 'connections' | 'profile'>('home')
  const [user, setUser] = useState<SafeUser | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [acceptedConnections, setAcceptedConnections] = useState<ConnectionRecord[]>([])
  const [incomingConnections, setIncomingConnections] = useState<ConnectionRecord[]>([])
  const [outgoingConnections, setOutgoingConnections] = useState<ConnectionRecord[]>([])
  const [searchResults, setSearchResults] = useState<SafeUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadValues, setUploadValues] = useState<UploadFormState>({
    title: '',
    description: '',
    sharedWithNetwork: false,
    file: null,
  })
  const [uploadOpen, setUploadOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Log in to start rebuilding your archive.')

  async function loadUserContext(currentToken: string) {
    const [me, content] = await Promise.all([
      apiRequest<SafeUser>('/user/me', {}, currentToken),
      apiRequest<Memory[]>('/content', {}, currentToken),
    ])

    setUser(me)
    setMemories(content)
  }

  async function loadConnections(currentToken: string) {
    const [accepted, incoming, outgoing] = await Promise.all([
      apiRequest<ConnectionRecord[]>('/connections/accepted', {}, currentToken),
      apiRequest<ConnectionRecord[]>('/connections/pending/incoming', {}, currentToken),
      apiRequest<ConnectionRecord[]>('/connections/pending/outgoing', {}, currentToken),
    ])

    setAcceptedConnections(accepted)
    setIncomingConnections(incoming)
    setOutgoingConnections(outgoing)
  }

  useEffect(() => {
    if (!token) {
      setUser(null)
      setMemories([])
      return
    }

    let active = true
    setBusy(true)
    setMessage('Loading your Memoire workspace...')

    void loadUserContext(token)
      .then(() => {
        if (active) {
          setMessage('Workspace ready.')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          const nextMessage = error instanceof Error ? error.message : 'Unable to load account'
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken('')
          setMessage(nextMessage)
        }
      })
      .finally(() => {
        if (active) {
          setBusy(false)
        }
      })

    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    if (!token || activeView !== 'connections') {
      return
    }

    let active = true
    setBusy(true)

    void loadConnections(token)
      .catch((error: unknown) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : 'Unable to load connections')
        }
      })
      .finally(() => {
        if (active) {
          setBusy(false)
        }
      })

    return () => {
      active = false
    }
  }, [activeView, token])

  async function handleLogin(payload: { username: string; password: string }) {
    setBusy(true)
    try {
      const data = await apiRequest<{ token: string }>('/user/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      setToken(data.token)
      setMessage('Logged in.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to log in')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateAccount(payload: {
    email: string
    username: string
    password: string
  }) {
    setBusy(true)
    try {
      await apiRequest<{ message: string }>('/user/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setMessage('Account created. Log in with your new credentials.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create account')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    if (token) {
      try {
        await apiRequest('/user/logout', { method: 'POST' }, token)
      } catch {
        // Logout should still clear local client state if the request fails.
      }
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setActiveView('home')
    setSearchResults([])
    setMessage('Logged out.')
  }

  async function handleDeleteAccount() {
    if (!token || !user) return

    const confirmed = window.confirm(
      `Delete the Memoire account for ${user.email}? This cannot be undone.`,
    )
    if (!confirmed) {
      return
    }

    setBusy(true)
    try {
      await apiRequest('/user/me', { method: 'DELETE' }, token)
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      setToken('')
      setUser(null)
      setMemories([])
      setAcceptedConnections([])
      setIncomingConnections([])
      setOutgoingConnections([])
      setSearchResults([])
      setSearchQuery('')
      setUploadOpen(false)
      setActiveView('home')
      setMessage('Account deleted.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete account')
    } finally {
      setBusy(false)
    }
  }

  async function handleStopEmails() {
    if (!token) return

    setBusy(true)
    try {
      await apiRequest('/deliveries/deactivate-current', { method: 'POST' }, token)
      setMessage('Your next scheduled email delivery has been turned off.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to stop email deliveries')
    } finally {
      setBusy(false)
    }
  }

  async function refreshHomeData() {
    if (!token) return
    const content = await apiRequest<Memory[]>('/content', {}, token)
    setMemories(content)
  }

  function handleUploadValueChange(
    field: keyof UploadFormState,
    value: string | boolean | File | null,
  ) {
    setUploadValues((current) => ({ ...current, [field]: value }))
  }

  async function handleUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !uploadValues.file) {
      setMessage('Select a photo first.')
      return
    }

    const body = new FormData()
    body.set('title', uploadValues.title)
    body.set('description', uploadValues.description)
    body.set('sharedWithNetwork', String(uploadValues.sharedWithNetwork))
    body.set('file', uploadValues.file)

    setBusy(true)
    try {
      const result = await apiRequest<UploadContentResponse>('/content', { method: 'POST', body }, token)
      setUploadValues({
        title: '',
        description: '',
        sharedWithNetwork: false,
        file: null,
      })
      setUploadOpen(false)
      await refreshHomeData()
      setMessage(
        result.deliveryScheduled
          ? 'Memory uploaded. A delivery was scheduled.'
          : 'Memory uploaded. Add at least 5 memories to start receiving deliveries.',
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to upload memory')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleShare(memory: Memory) {
    if (!token) return
    setBusy(true)
    try {
      await apiRequest(`/content/${memory.id}/toggle-share`, { method: 'POST' }, token)
      await refreshHomeData()
      setMessage(memory.shared_with_network ? 'Memory made private.' : 'Memory shared with network.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update memory sharing')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(memory: Memory) {
    if (!token) return
    setBusy(true)
    try {
      await apiRequest(`/content/${memory.id}`, { method: 'DELETE' }, token)
      await refreshHomeData()
      setMessage(`Removed "${memory.title}".`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove memory')
    } finally {
      setBusy(false)
    }
  }

  async function handleSearchConnections() {
    if (!token || !searchQuery.trim()) {
      setMessage('Enter an email fragment to search.')
      return
    }

    setBusy(true)
    try {
      const users = await apiRequest<SafeUser[]>(
        `/user/search?email=${encodeURIComponent(searchQuery.trim())}`,
        {},
        token,
      )
      setSearchResults(users)
      setMessage(users.length ? 'Search complete.' : 'No users matched that email.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to search users')
    } finally {
      setBusy(false)
    }
  }

  async function handleConnect(userId: number) {
    if (!token) return
    setBusy(true)
    try {
      await apiRequest(`/connections/${userId}`, { method: 'POST' }, token)
      await loadConnections(token)
      setMessage('Connection request sent.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send request')
    } finally {
      setBusy(false)
    }
  }

  async function handleAcceptConnection(connectionId: number) {
    if (!token) return
    setBusy(true)
    try {
      await apiRequest(`/connections/${connectionId}/accept`, { method: 'POST' }, token)
      await loadConnections(token)
      setMessage('Connection accepted.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to accept connection')
    } finally {
      setBusy(false)
    }
  }

  async function handleRejectConnection(connectionId: number) {
    if (!token) return
    setBusy(true)
    try {
      await apiRequest(`/connections/${connectionId}/reject`, { method: 'POST' }, token)
      await loadConnections(token)
      setMessage('Connection request declined.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to decline connection')
    } finally {
      setBusy(false)
    }
  }

  if (!token || !user) {
    return (
      <LoginCreatePage
        busy={busy}
        message={message}
        onCreateAccount={handleCreateAccount}
        onLogin={handleLogin}
      />
    )
  }

  const activePage =
    activeView === 'home' ? (
      <HomePage
        busy={busy}
        memories={memories}
        message={message}
        onDelete={handleDelete}
        onToggleShare={handleToggleShare}
        onUploadOpenChange={setUploadOpen}
        onUploadChange={handleUploadValueChange}
        onUploadSubmit={handleUploadSubmit}
        uploadOpen={uploadOpen}
        uploadValues={uploadValues}
        user={user}
      />
    ) : activeView === 'connections' ? (
      <ConnectionsPage
        accepted={acceptedConnections}
        busy={busy}
        currentUserId={user.id}
        incoming={incomingConnections}
        message={message}
        onAccept={handleAcceptConnection}
        onConnect={handleConnect}
        onReject={handleRejectConnection}
        onSearch={handleSearchConnections}
        onSearchQueryChange={setSearchQuery}
        outgoing={outgoingConnections}
        searchQuery={searchQuery}
        searchResults={searchResults}
      />
    ) : (
      <ProfilePage
        busy={busy}
        message={message}
        onStopEmails={handleStopEmails}
        onDeleteAccount={handleDeleteAccount}
        user={user}
      />
    )

  return (
    <div className="app-shell">
      <Navbar activeView={activeView} onLogout={handleLogout} onNavigate={setActiveView} />
      {activePage}
    </div>
  )
}

export default App
