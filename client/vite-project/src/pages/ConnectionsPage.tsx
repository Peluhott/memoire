import ConnectionCard from '../components/ConnectionCard'
import type { ConnectionRecord, SafeUser } from '../types'
import './ConnectionsPage.css'

type ConnectionsPageProps = {
  currentUserId: number
  accepted: ConnectionRecord[]
  incoming: ConnectionRecord[]
  outgoing: ConnectionRecord[]
  searchQuery: string
  searchResults: SafeUser[]
  busy: boolean
  message: string
  onSearchQueryChange: (value: string) => void
  onSearch: () => void
  onConnect: (userId: number) => void
  onAccept: (connectionId: number) => void
  onReject: (connectionId: number) => void
}

function ConnectionsPage({
  currentUserId,
  accepted,
  incoming,
  outgoing,
  searchQuery,
  searchResults,
  busy,
  message,
  onSearchQueryChange,
  onSearch,
  onConnect,
  onAccept,
  onReject,
}: ConnectionsPageProps) {
  return (
    <main className="connections-page">
      <section className="connections-hero">
        <div>
          <p className="page-kicker">Connections</p>
          <h1>Build your memory network</h1>
          <p>
            Browse accepted friends, answer incoming requests, and search by email when you want to
            grow the network.
          </p>
        </div>
        <form
          className="connections-search"
          onSubmit={(event) => {
            event.preventDefault()
            onSearch()
          }}
        >
          <input
            placeholder="Search by email"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
          <button disabled={busy} type="submit">
            Search
          </button>
        </form>
      </section>

      <p className="page-message" role="status">
        {message}
      </p>

      {searchResults.length ? (
        <section className="connections-section">
          <div className="connections-section__header">
            <h2>Search results</h2>
          </div>
          <div className="connections-grid">
            {searchResults.map((user) => (
              <ConnectionCard
                key={user.id}
                connection={user}
                currentUserId={currentUserId}
                onConnect={onConnect}
                variant="search"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="connections-section">
        <div className="connections-section__header">
          <h2>Friends</h2>
          <span>{accepted.length}</span>
        </div>
        {accepted.length ? (
          <div className="connections-grid">
            {accepted.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                currentUserId={currentUserId}
                variant="accepted"
              />
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <h3>No accepted connections</h3>
            <p>Search by email to send your first request.</p>
          </div>
        )}
      </section>

      <section className="connections-columns">
        <div className="connections-stack">
          <div className="connections-section__header">
            <h2>Incoming</h2>
            <span>{incoming.length}</span>
          </div>
          {incoming.length ? (
            incoming.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                currentUserId={currentUserId}
                onAccept={onAccept}
                onReject={onReject}
                variant="incoming"
              />
            ))
          ) : (
            <div className="empty-panel compact">
              <p>No pending requests.</p>
            </div>
          )}
        </div>

        <div className="connections-stack">
          <div className="connections-section__header">
            <h2>Outgoing</h2>
            <span>{outgoing.length}</span>
          </div>
          {outgoing.length ? (
            outgoing.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                currentUserId={currentUserId}
                variant="outgoing"
              />
            ))
          ) : (
            <div className="empty-panel compact">
              <p>No requests sent yet.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default ConnectionsPage
