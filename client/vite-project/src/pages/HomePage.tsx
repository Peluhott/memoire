import type { ChangeEvent, FormEvent } from 'react'
import MemoryCard from '../components/MemoryCard'
import type { Memory, SafeUser } from '../types'
import './HomePage.css'

type UploadFormState = {
  title: string
  description: string
  sharedWithNetwork: boolean
  file: File | null
}

type HomePageProps = {
  user: SafeUser
  memories: Memory[]
  uploadValues: UploadFormState
  uploadOpen: boolean
  busy: boolean
  message: string
  onUploadOpenChange: (open: boolean) => void
  onUploadChange: (field: keyof UploadFormState, value: string | boolean | File | null) => void
  onUploadSubmit: (event: FormEvent<HTMLFormElement>) => void
  onToggleShare: (memory: Memory) => void
  onDelete: (memory: Memory) => void
}

function HomePage({
  user,
  memories,
  uploadValues,
  uploadOpen,
  busy,
  message,
  onUploadOpenChange,
  onUploadChange,
  onUploadSubmit,
  onToggleShare,
  onDelete,
}: HomePageProps) {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div>
          <p className="page-kicker">Your archive</p>
          <h1>{user.name || user.username}'s memory shelf</h1>
          <p>
            Save a photo, add a note, and let Memoire schedule a random future delivery back to your
            inbox.
          </p>
        </div>
        <div className="home-hero__stats">
          <div>
            <strong>{memories.length}</strong>
            <span>Memories saved</span>
          </div>
        </div>
      </section>

      <section className="home-toolbar">
        <button disabled={busy} type="button" onClick={() => onUploadOpenChange(true)}>
          Upload memory
        </button>
      </section>

      {uploadOpen ? (
        <section className="upload-overlay" onClick={() => onUploadOpenChange(false)}>
          <form
            className="upload-panel"
            onClick={(event) => event.stopPropagation()}
            onSubmit={onUploadSubmit}
          >
            <div className="upload-panel__header">
              <div>
                <p className="page-kicker">Upload</p>
                <h2>Add a new memory</h2>
              </div>
              <button
                className="upload-panel__close"
                type="button"
                onClick={() => onUploadOpenChange(false)}
              >
                Close
              </button>
            </div>
            <label>
              Title
              <input
                required
                value={uploadValues.title}
                onChange={(event) => onUploadChange('title', event.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                value={uploadValues.description}
                onChange={(event) => onUploadChange('description', event.target.value)}
              />
            </label>
            <label>
              Photo
              <input
                required
                type="file"
                accept="image/*"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onUploadChange('file', event.target.files?.[0] ?? null)
                }
              />
            </label>
            <label className="upload-panel__toggle">
              <input
                checked={uploadValues.sharedWithNetwork}
                type="checkbox"
                onChange={(event) => onUploadChange('sharedWithNetwork', event.target.checked)}
              />
              <span>Make this memory shareable with network</span>
            </label>
            <p className="upload-panel__note">
              Upload at least 5 memories and Memoire will start scheduling email deliveries for you.
            </p>
            <button disabled={busy} type="submit">
              {busy ? 'Saving...' : 'Save memory'}
            </button>
            <p className="page-message" role="status">
              {message}
            </p>
          </form>
        </section>
      ) : null}

      <section className="memories-section">
        <div className="memories-section__header">
          <div>
            <p className="page-kicker">Gallery</p>
            <h2>Your saved memories</h2>
          </div>
        </div>
        {memories.length ? (
          <div className="memory-grid">
            {memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onDelete={onDelete}
                onToggleShare={onToggleShare}
              />
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <h3>No memories yet</h3>
            <p>Upload your first photo and description to start the archive.</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default HomePage
