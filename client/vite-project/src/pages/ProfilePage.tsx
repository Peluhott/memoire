import './ProfilePage.css'
import type { SafeUser } from '../types'

type ProfilePageProps = {
  busy: boolean
  message: string
  user: SafeUser
  onStopEmails: () => void
  onDeleteAccount: () => void
}

function ProfilePage({ busy, message, user, onStopEmails, onDeleteAccount }: ProfilePageProps) {
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
