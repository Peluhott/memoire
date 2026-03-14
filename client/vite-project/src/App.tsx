import { useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

type View = 'home' | 'profile' | 'connections'

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

type UserProfile = {
  id: number
  username: string
  name: string | null
  email: string
  profilePictureUrl: string | null
  limit_upload: number
  limit_connections: number
}

type SearchUser = {
  id: number
  username: string
  name: string | null
  email: string
  profilePictureUrl: string | null
}

type ConnectionParty = {
  id: number
  username: string
  name: string | null
  email: string
  profilePictureUrl: string | null
}

type ConnectionRecord = {
  id: number
  requester: number
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED'
  createdAt: string
  updatedAt: string
  userA: ConnectionParty
  userB: ConnectionParty
}

function App() {
  const [activeView, setActiveView] = useState<View>('home')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [status, setStatus] = useState('Create an account or log in to get started.')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingUploads, setIsLoadingUploads] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingShareId, setTogglingShareId] = useState<number | null>(null)
  const [contentItems, setContentItems] = useState<ContentCard[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileName, setProfileName] = useState('')
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [acceptedConnections, setAcceptedConnections] = useState<ConnectionRecord[]>([])
  const [incomingConnections, setIncomingConnections] = useState<ConnectionRecord[]>([])
  const [outgoingConnections, setOutgoingConnections] = useState<ConnectionRecord[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [requestingConnectionId, setRequestingConnectionId] = useState<number | null>(null)
  const [updatingConnectionId, setUpdatingConnectionId] = useState<number | null>(null)

  const isLoggedIn = token.length > 0

  async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, init)
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message ?? data.error ?? 'Request failed')
    }

    return data as T
  }

  function applyProfileToForm(nextProfile: UserProfile) {
    setProfile(nextProfile)
    setProfileName(nextProfile.name ?? nextProfile.username)
  }

  function getOtherUser(connection: ConnectionRecord) {
    if (!profile) {
      return connection.userA
    }

    return connection.userA.id === profile.id ? connection.userB : connection.userA
  }

  function getConnectionState(userId: number) {
    const accepted = acceptedConnections.find((connection) => getOtherUser(connection).id === userId)
    if (accepted) {
      return 'Connected'
    }

    const incoming = incomingConnections.find((connection) => getOtherUser(connection).id === userId)
    if (incoming) {
      return 'Sent you a request'
    }

    const outgoing = outgoingConnections.find((connection) => getOtherUser(connection).id === userId)
    if (outgoing) {
      return 'Request pending'
    }

    return null
  }

  async function loadProfile(authToken = token) {
    if (!authToken) {
      return
    }

    const nextProfile = await fetchJson<UserProfile>('/user/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    applyProfileToForm(nextProfile)
  }

  async function loadConnections(authToken = token) {
    if (!authToken) {
      return
    }

    setIsLoadingConnections(true)

    try {
      const [accepted, incoming, outgoing] = await Promise.all([
        fetchJson<ConnectionRecord[]>('/connections/accepted', {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetchJson<ConnectionRecord[]>('/connections/pending/incoming', {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetchJson<ConnectionRecord[]>('/connections/pending/outgoing', {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ])

      setAcceptedConnections(accepted)
      setIncomingConnections(incoming)
      setOutgoingConnections(outgoing)
    } finally {
      setIsLoadingConnections(false)
    }
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

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('Logging in...')

    try {
      const data = await fetchJson<{ token: string }>('/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      setToken(data.token)
      setActiveView('home')
      setIsUploadOpen(false)
      await Promise.all([loadUploads(data.token), loadProfile(data.token), loadConnections(data.token)])
      setStatus('Logged in.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function logout(statusMessage = 'Logged out.') {
    if (!token) {
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
      setProfile(null)
      setProfileImageFile(null)
      setContentItems([])
      setAcceptedConnections([])
      setIncomingConnections([])
      setOutgoingConnections([])
      setSearchResults([])
      setSearchEmail('')
      setIsUploadOpen(false)
      setActiveView('home')
      setStatus(statusMessage)
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
      if (withUrls.length === 0) {
        setStatus('No memories yet. Upload one to get started.')
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load uploads')
    } finally {
      setIsLoadingUploads(false)
    }
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !file) {
      setStatus(!token ? 'Login required before uploading.' : 'Choose an image before uploading.')
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

  async function toggleContentShare(item: ContentCard) {
    if (!token) {
      setStatus('Login required before updating sharing.')
      return
    }

    setTogglingShareId(item.id)
    setStatus(`${item.shared_with_network ? 'Removing' : 'Adding'} "${item.title}" from shared memories...`)

    try {
      const updated = await fetchJson<ContentItem>(`/content/${item.id}/toggle-share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      setContentItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, shared_with_network: updated.shared_with_network } : entry,
        ),
      )
      setStatus(
        updated.shared_with_network
          ? `"${item.title}" is now shared with your network.`
          : `"${item.title}" is no longer shared with your network.`,
      )
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update sharing')
    } finally {
      setTogglingShareId(null)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      return
    }

    setIsSavingProfile(true)
    setStatus('Saving profile...')

    try {
      const updated = await fetchJson<UserProfile>('/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileName,
        }),
      })

      applyProfileToForm(updated)
      setStatus('Profile updated.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Profile update failed')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function uploadProfilePicture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !profileImageFile) {
      setStatus('Choose an image before uploading a profile picture.')
      return
    }

    setIsUploadingProfileImage(true)
    setStatus('Uploading profile picture...')

    try {
      const formData = new FormData()
      formData.append('file', profileImageFile)

      const updated = await fetchJson<UserProfile>('/user/profile-picture', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      applyProfileToForm(updated)
      setProfileImageFile(null)
      setStatus('Profile picture updated.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Profile picture upload failed')
    } finally {
      setIsUploadingProfileImage(false)
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      return
    }

    setIsSavingPassword(true)
    setStatus('Updating password...')

    try {
      const response = await fetchJson<{ message: string }>('/user/password', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      setCurrentPassword('')
      setNewPassword('')
      await logout(response.message)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Password update failed')
      setIsSavingPassword(false)
    }
  }

  async function searchUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      return
    }

    const trimmedEmail = searchEmail.trim()
    if (!trimmedEmail) {
      setSearchResults([])
      setStatus('Enter an email to search.')
      return
    }

    setIsSearchingUsers(true)
    setStatus(`Searching for "${trimmedEmail}"...`)

    try {
      const results = await fetchJson<SearchUser[]>(
        `/user/search?email=${encodeURIComponent(trimmedEmail)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSearchResults(results)
      setStatus(results.length > 0 ? 'Search complete.' : 'No users matched that email.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Search failed')
    } finally {
      setIsSearchingUsers(false)
    }
  }

  async function sendConnectionRequest(user: SearchUser) {
    if (!token) {
      return
    }

    setRequestingConnectionId(user.id)
    setStatus(`Sending request to ${user.name ?? user.username}...`)

    try {
      await fetchJson(`/connections/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      await loadConnections(token)
      setStatus(`Connection request sent to ${user.name ?? user.username}.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send friend request')
    } finally {
      setRequestingConnectionId(null)
    }
  }

  async function acceptConnection(connection: ConnectionRecord) {
    if (!token) {
      return
    }

    const person = getOtherUser(connection)
    setUpdatingConnectionId(connection.id)
    setStatus(`Accepting ${person.name ?? person.username}...`)

    try {
      await fetchJson(`/connections/${connection.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      await loadConnections(token)
      setStatus(`Accepted ${person.name ?? person.username}.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not accept connection')
    } finally {
      setUpdatingConnectionId(null)
    }
  }

  async function rejectConnection(connection: ConnectionRecord) {
    if (!token) {
      return
    }

    const person = getOtherUser(connection)
    setUpdatingConnectionId(connection.id)
    setStatus(`Declining ${person.name ?? person.username}...`)

    try {
      await fetchJson(`/connections/${connection.id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      await loadConnections(token)
      setStatus(`Declined ${person.name ?? person.username}.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not reject connection')
    } finally {
      setUpdatingConnectionId(null)
    }
  }

  function renderAuthPage() {
    return (
      <div className="auth-page">
        <section className="auth-hero">
          <p className="eyebrow">Memoire</p>
          <h1>Resurface the moments worth keeping.</h1>
          <p className="hero-copy">
            Create an account or log in to manage your uploads, your profile, and your connections.
          </p>
          <p className="status-line">{status}</p>
        </section>

        <section className="auth-page-card">
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

            <form className="auth-form login-panel" onSubmit={login}>
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
              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Working...' : 'Login'}
              </button>
            </form>
          </div>
        </section>
      </div>
    )
  }

  function renderHomeView() {
    return (
      <>
        <section className="home-hero">
          <div>
            <p className="eyebrow">Homepage</p>
            <h1>Your uploads</h1>
          </div>
          <div className="toolbar">
            <button type="button" onClick={() => setIsUploadOpen((current) => !current)}>
              {isUploadOpen ? 'Close Upload' : 'Upload'}
            </button>
            <button
              className="ghost-button"
              disabled={isLoadingUploads}
              type="button"
              onClick={() => void loadUploads()}
            >
              {isLoadingUploads ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </section>

        {isUploadOpen ? (
          <section className="upload-panel">
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
          </section>
        ) : null}

        {contentItems.length === 0 ? (
          <div className="empty-state">
            <p>No uploads yet.</p>
          </div>
        ) : (
          <section className="memory-grid">
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
                    <span>{item.shared_with_network ? 'Shared with network' : 'Private'}</span>
                  </div>
                  <div className="memory-actions">
                    <button
                      className="ghost-button"
                      disabled={
                        togglingShareId === item.id ||
                        sendingEmailId === item.id ||
                        deletingId === item.id
                      }
                      type="button"
                      onClick={() => void toggleContentShare(item)}
                    >
                      {togglingShareId === item.id
                        ? 'Saving...'
                        : item.shared_with_network
                          ? 'Make Private'
                          : 'Share with Network'}
                    </button>
                    <button
                      disabled={
                        sendingEmailId === item.id ||
                        deletingId === item.id ||
                        togglingShareId === item.id
                      }
                      type="button"
                      onClick={() => void sendImageEmail(item)}
                    >
                      {sendingEmailId === item.id ? 'Sending...' : 'Generate Email'}
                    </button>
                    <button
                      className="ghost-button danger-button"
                      disabled={
                        deletingId === item.id ||
                        sendingEmailId === item.id ||
                        togglingShareId === item.id
                      }
                      type="button"
                      onClick={() => void removeContent(item)}
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </>
    )
  }

  function renderProfileView() {
    return (
      <div className="profile-layout">
        <section className="profile-summary">
          <p className="eyebrow">Profile</p>
          <div className="profile-header">
            {profile?.profilePictureUrl ? (
              <img
                alt={profile.name ?? profile.username}
                className="profile-avatar"
                src={profile.profilePictureUrl}
              />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">
                {(profile?.name ?? profile?.username ?? 'M').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h1>{profile?.name ?? profile?.username ?? 'Your profile'}</h1>
              <p>{profile?.email ?? 'No email available.'}</p>
            </div>
          </div>
        </section>

        <section className="profile-card">
          <h2>Edit profile</h2>
          <form className="profile-form" onSubmit={saveProfile}>
            <label>
              <span>Name</span>
              <input value={profileName} onChange={(event) => setProfileName(event.target.value)} />
            </label>
            <button disabled={isSavingProfile} type="submit">
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>

        <section className="profile-card">
          <h2>Profile picture</h2>
          <form className="profile-form" onSubmit={uploadProfilePicture}>
            <label>
              <span>Upload image</span>
              <input
                accept="image/*"
                type="file"
                onChange={(event) => setProfileImageFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button disabled={isUploadingProfileImage} type="submit">
              {isUploadingProfileImage ? 'Uploading...' : 'Upload Picture'}
            </button>
          </form>
        </section>

        <section className="profile-card">
          <h2>Change password</h2>
          <form className="profile-form" onSubmit={savePassword}>
            <label>
              <span>Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>
            <label>
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>
            <button disabled={isSavingPassword} type="submit">
              {isSavingPassword ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>
    )
  }

  function renderConnectionList(
    titleText: string,
    items: ConnectionRecord[],
    emptyCopy: string,
    renderActions?: (connection: ConnectionRecord) => ReactNode,
  ) {
    return (
      <section className="connections-card">
        <div className="section-heading">
          <h2>{titleText}</h2>
          <span>{items.length}</span>
        </div>

        {items.length === 0 ? (
          <p className="empty-copy">{emptyCopy}</p>
        ) : (
          <div className="connection-list">
            {items.map((connection) => {
              const person = getOtherUser(connection)

              return (
                <article className="person-card" key={connection.id}>
                  {person.profilePictureUrl ? (
                    <img alt={person.name ?? person.username} className="person-avatar" src={person.profilePictureUrl} />
                  ) : (
                    <div className="person-avatar person-avatar-fallback">
                      {(person.name ?? person.username).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="person-copy">
                    <h3>{person.name ?? person.username}</h3>
                    <p>{person.email}</p>
                    <span className="person-meta">@{person.username}</span>
                  </div>
                  {renderActions ? <div className="person-actions">{renderActions(connection)}</div> : null}
                </article>
              )
            })}
          </div>
        )}
      </section>
    )
  }

  function renderConnectionsView() {
    return (
      <div className="connections-layout">
        <section className="connections-hero">
          <div>
            <p className="eyebrow">Connections</p>
            <h1>Build your circle</h1>
            <p className="hero-copy">
              Search by email to find people, send requests, and keep track of accepted and pending connections.
            </p>
          </div>
          <button
            className="ghost-button"
            disabled={isLoadingConnections}
            type="button"
            onClick={() => void loadConnections()}
          >
            {isLoadingConnections ? 'Refreshing...' : 'Refresh lists'}
          </button>
        </section>

        <section className="connections-card">
          <div className="section-heading">
            <h2>Find people</h2>
          </div>
          <form className="search-form" onSubmit={searchUsers}>
            <input
              placeholder="Search by email"
              type="email"
              value={searchEmail}
              onChange={(event) => setSearchEmail(event.target.value)}
            />
            <button disabled={isSearchingUsers} type="submit">
              {isSearchingUsers ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 ? (
            <div className="search-results">
              {searchResults.map((user) => {
                const connectionState = getConnectionState(user.id)

                return (
                  <article className="person-card" key={user.id}>
                    {user.profilePictureUrl ? (
                      <img alt={user.name ?? user.username} className="person-avatar" src={user.profilePictureUrl} />
                    ) : (
                      <div className="person-avatar person-avatar-fallback">
                        {(user.name ?? user.username).slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="person-copy">
                      <h3>{user.name ?? user.username}</h3>
                      <p>{user.email}</p>
                      <span className="person-meta">@{user.username}</span>
                    </div>
                    {connectionState ? (
                      <span className="connection-state">{connectionState}</span>
                    ) : (
                      <button
                        disabled={requestingConnectionId === user.id}
                        type="button"
                        onClick={() => void sendConnectionRequest(user)}
                      >
                        {requestingConnectionId === user.id ? 'Sending...' : 'Add Friend'}
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="empty-copy">Search results will appear here.</p>
          )}
        </section>

        <div className="connections-grid">
          {renderConnectionList('Accepted', acceptedConnections, 'No accepted connections yet.')}
          {renderConnectionList(
            'Incoming requests',
            incomingConnections,
            'No incoming requests right now.',
            (connection) => (
              <>
                <button
                  disabled={updatingConnectionId === connection.id}
                  type="button"
                  onClick={() => void acceptConnection(connection)}
                >
                  {updatingConnectionId === connection.id ? 'Working...' : 'Accept'}
                </button>
                <button
                  className="ghost-button danger-button"
                  disabled={updatingConnectionId === connection.id}
                  type="button"
                  onClick={() => void rejectConnection(connection)}
                >
                  Reject
                </button>
              </>
            ),
          )}
          {renderConnectionList('Outgoing requests', outgoingConnections, 'No outgoing requests pending.')}
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return renderAuthPage()
  }

  return (
    <div className="home-shell">
      <header className="topbar">
        <div className="nav-group">
          <button
            className={activeView === 'home' ? 'nav-button nav-button-active' : 'ghost-button nav-button'}
            type="button"
            onClick={() => setActiveView('home')}
          >
            Home
          </button>
          <button
            className={activeView === 'profile' ? 'nav-button nav-button-active' : 'ghost-button nav-button'}
            type="button"
            onClick={() => setActiveView('profile')}
          >
            Profile
          </button>
          <button
            className={activeView === 'connections' ? 'nav-button nav-button-active' : 'ghost-button nav-button'}
            type="button"
            onClick={() => {
              setActiveView('connections')
              void loadConnections()
            }}
          >
            Connections
          </button>
        </div>
        <p className="brand">Memoire</p>
        <button className="ghost-button" disabled={isSubmitting} type="button" onClick={() => void logout()}>
          Logout
        </button>
      </header>

      <main className="layout">
        <section className="status-card">
          <p className="status-line">{status}</p>
        </section>

        {activeView === 'home' ? renderHomeView() : null}
        {activeView === 'profile' ? renderProfileView() : null}
        {activeView === 'connections' ? renderConnectionsView() : null}
      </main>
    </div>
  )
}

export default App
