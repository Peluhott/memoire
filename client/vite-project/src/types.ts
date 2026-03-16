export type SafeUser = {
  id: number
  username: string
  email: string
  name?: string | null
  profilePictureUrl?: string | null
}

export type Memory = {
  id: number
  title: string
  description: string
  shared_with_network: boolean
  uploaded_at: string
  imageUrl?: string
  public_id: string
  resource_type: string
}

export type DeliveryHistoryItem = {
  id: number
  scheduledFor: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  content?: {
    title: string
  } | null
}

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED'

export type ConnectionRecord = {
  id: number
  requester: number
  status: ConnectionStatus
  createdAt: string
  updatedAt: string
  userA: SafeUser
  userB: SafeUser
}
