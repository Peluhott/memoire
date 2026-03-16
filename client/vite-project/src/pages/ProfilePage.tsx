import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import './ProfilePage.css'
import type { SafeUser } from '../types'

type ProfilePageProps = {
  busy: boolean
  message: string
  user: SafeUser
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  onUpdateProfileName: (name: string) => Promise<boolean>
  onUploadProfilePicture: (file: File | null) => Promise<boolean>
  onStopEmails: () => void
  onDeleteAccount: () => void
}

function ProfilePage({
  busy,
  message,
  user,
  onUpdatePassword,
  onUpdateProfileName,
  onUploadProfilePicture,
  onStopEmails,
  onDeleteAccount,
}: ProfilePageProps) {
  const [name, setName] = useState(user.name || user.username)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    setName(user.name || user.username)
  }, [user.name, user.username])

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div>
          <p className="page-kicker">User info</p>
          <h1>Manage your Memoire account</h1>
          <p>Review your account, pause the next email delivery, or permanently delete the archive.</p>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-card__identity">
          <div className="profile-card__avatar">
            {user.profilePictureUrl ? (
              <img alt={`${user.username} profile`} src={user.profilePictureUrl} />
            ) : (
              <span>{(user.name || user.username).charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="page-kicker">Profile photo</p>
            <h2>{user.name || user.username}</h2>
            <p>Change the picture shown for your Memoire account.</p>
          </div>
        </div>

        <div className="profile-card__row">
          <span>Name</span>
          <strong>{user.name || user.username}</strong>
        </div>
        <div className="profile-card__row">
          <span>Username</span>
          <strong>{user.username}</strong>
        </div>
        <div className="profile-card__row">
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>

        <form
          className="profile-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            void onUpdateProfileName(name)
          }}
        >
          <div className="profile-form__header">
            <div>
              <p className="page-kicker">Edit profile</p>
              <h2>Update your name</h2>
            </div>
          </div>
          <label>
            Display name
            <input required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <button disabled={busy} type="submit">
            {busy ? 'Saving...' : 'Save name'}
          </button>
        </form>

        <form
          className="profile-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            void onUploadProfilePicture(profileFile).then((updated) => {
              if (updated) {
                setProfileFile(null)
              }
            })
          }}
        >
          <div className="profile-form__header">
            <div>
              <p className="page-kicker">Edit profile</p>
              <h2>Upload a new picture</h2>
            </div>
          </div>
          <label>
            Profile image
            <input
              required
              accept="image/*"
              type="file"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setProfileFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
          <button disabled={busy} type="submit">
            {busy ? 'Uploading...' : 'Upload picture'}
          </button>
        </form>

        <form
          className="profile-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            void onUpdatePassword(currentPassword, newPassword).then((updated) => {
              if (updated) {
                setCurrentPassword('')
                setNewPassword('')
              }
            })
          }}
        >
          <div className="profile-form__header">
            <div>
              <p className="page-kicker">Security</p>
              <h2>Change your password</h2>
            </div>
          </div>
          <label>
            Current password
            <input
              required
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label>
            New password
            <input
              required
              minLength={8}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <button disabled={busy} type="submit">
            {busy ? 'Updating...' : 'Change password'}
          </button>
        </form>

        <div className="profile-card__danger">
          <div>
            <h2>Stop next email</h2>
            <p>Turn off your currently pending Memoire delivery without deleting your account.</p>
          </div>
          <button className="profile-card__action" disabled={busy} type="button" onClick={onStopEmails}>
            {busy ? 'Updating...' : 'Stop next email'}
          </button>
        </div>

        <div className="profile-card__danger">
          <div>
            <h2>Delete account</h2>
            <p>This permanently removes your account, memories, deliveries, and connection records.</p>
          </div>
          <button
            className="profile-card__delete"
            disabled={busy}
            type="button"
            onClick={onDeleteAccount}
          >
            {busy ? 'Deleting...' : 'Delete account'}
          </button>
        </div>

        <p className="page-message" role="status">
          {message}
        </p>
      </section>
    </main>
  )
}

export default ProfilePage
