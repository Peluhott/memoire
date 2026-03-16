import type { Memory } from '../types'
import './MemoryCard.css'

type MemoryCardProps = {
  memory: Memory
  onToggleShare: (memory: Memory) => void
  onDelete: (memory: Memory) => void
}

function MemoryCard({ memory, onToggleShare, onDelete }: MemoryCardProps) {
  return (
    <article className="memory-card">
      <div className="memory-card__media">
        {memory.imageUrl ? (
          <img className="memory-card__image" src={memory.imageUrl} alt={memory.title} />
        ) : (
          <div className="memory-card__fallback">{memory.title.slice(0, 1)}</div>
        )}
        <div className="memory-card__overlay">
          <span className="memory-card__badge">
            {memory.shared_with_network ? 'Shared with network' : 'Private memory'}
          </span>
          <h3>{memory.title}</h3>
          <p>{memory.description || 'Saved to come back to later.'}</p>
        </div>
      </div>
      <div className="memory-card__footer">
        <div className="memory-card__meta">
          <span>{new Date(memory.uploaded_at).toLocaleDateString()}</span>
          <span>{memory.resource_type}</span>
        </div>
        <div className="memory-card__actions">
          <button type="button" onClick={() => onToggleShare(memory)}>
            {memory.shared_with_network ? 'Make private' : 'Share with network'}
          </button>
          <button className="memory-card__delete" type="button" onClick={() => onDelete(memory)}>
            Remove
          </button>
        </div>
      </div>
    </article>
  )
}

export default MemoryCard
