import * as repo from './connection.repository';

/**
 * Create a connection request (or return existing)
 */
export async function createConnection(userId1: number, userId2: number) {
  if (!Number.isInteger(userId1) || !Number.isInteger(userId2)) {
    throw new Error('user ids must be integers');
  }

  // default requester to the initiator if not provided
  
  return await repo.createConnection(userId1, userId2);
}



export async function listAllConnections(userId: number) {
  if (!Number.isInteger(userId)) throw new Error('userId must be an integer');
  return await repo.listConnectionsForUser(userId);
}

export async function listAcceptedConnections(userId: number) {
  if (!Number.isInteger(userId)) throw new Error('userId must be an integer');
  return await repo.listAcceptedConnectionsForUser(userId);
}

export async function listIncomingPendingConnections(userId: number) {
  if (!Number.isInteger(userId)) throw new Error('userId must be an integer');
  return await repo.listIncomingPendingConnections(userId);
}

export async function listOutgoingPendingConnections(userId: number) {
  if (!Number.isInteger(userId)) throw new Error('userId must be an integer');
  return await repo.listOutgoingPendingConnections(userId);
}

export async function acceptIncomingConnection(connectionId: number, userId: number) {
  if (!Number.isInteger(connectionId) || !Number.isInteger(userId)) {
    throw new Error('ids must be integers');
  }

  return await repo.acceptIncomingConnection(connectionId, userId);
}

export async function rejectIncomingConnection(connectionId: number, userId: number) {
  if (!Number.isInteger(connectionId) || !Number.isInteger(userId)) {
    throw new Error('ids must be integers');
  }

  return await repo.rejectIncomingConnection(connectionId, userId);
}

export async function blockUser(blockerId: number, blockedId: number) {
  if (!Number.isInteger(blockerId) || !Number.isInteger(blockedId)) throw new Error('user ids must be integers');
  return await repo.blockUser(blockerId, blockedId);
}

export async function listBlockedByUser(userId: number) {
  if (!Number.isInteger(userId)) throw new Error('userId must be an integer');
  return await repo.listBlockedByUser(userId);
}

export async function listUsersWhoBlockedUser(userId: number) {
  if (!Number.isInteger(userId)) throw new Error('userId must be an integer');
  return await repo.listUsersWhoBlockedUser(userId);
}
