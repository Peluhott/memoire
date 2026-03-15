import type { ConnectionRecord, SafeUser } from '../types'
import './ConnectionCard.css'

type ConnectionCardProps = {
  currentUserId: number
  connection: ConnectionRecord | SafeUser
  variant?: 'accepted' | 'incoming' | 'outgoing' | 'search'
  onAccept?: (connectionId: number) => void
  onReject?: (connectionId: number) => void
  onConnect?: (userId: number) => void
}

function isConnectionRecord(value: ConnectionRecord | SafeUser): value is ConnectionRecord {
  return 'userA' in value
}

function getDisplayUser(currentUserId: number, connection: ConnectionRecord | SafeUser) {
  if (!isConnectionRecord(connection)) {
    return connection
  }

  return connection.userA.id === currentUserId ? connection.userB : connection.userA
}

function ConnectionCard({
  currentUserId,
  connection,
  variant = 'accepted',
  onAccept,
  onReject,
  onConnect,
}: ConnectionCardProps) {
  const person = getDisplayUser(currentUserId, connection)
  const initials = (person.name || person.username || person.email).slice(0, 2).toUpperCase()

  return (
    <article className="connection-card">
      <div className="connection-card__image-wrap">
        {person.profilePictureUrl ? (
          <img className="connection-card__image" src={person.profilePictureUrl} alt={person.username} />
        ) : (
          <div className="connection-card__fallback">{initials}</div>
        )}
      </div>
      <div className="connection-card__body">
        <div>
          <h3>{person.name || person.username}</h3>
          <p>{person.email}</p>
        </div>
        <div className="connection-card__actions">
          {variant === 'incoming' && isConnectionRecord(connection) ? (
            <>
              <button type="button" onClick={() => onAccept?.(connection.id)}>
                Accept
              </button>
              <button className="connection-card__ghost" type="button" onClick={() => onReject?.(connection.id)}>
                Decline
              </button>
            </>
          ) : null}
          {variant === 'outgoing' ? <span className="connection-card__pill">Request sent</span> : null}
          {variant === 'accepted' ? <span className="connection-card__pill">Connected</span> : null}
          {variant === 'search' ? (
            <button type="button" onClick={() => onConnect?.(person.id)}>
              Add connection
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default ConnectionCard
