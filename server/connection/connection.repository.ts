import prisma from "../prisma/prisma";
import { Prisma } from '@prisma/client';

const connectionUserSelect = {
  id: true,
  username: true,
  name: true,
  email: true,
  profilePictureUrl: true,
} satisfies Prisma.userSelect;

/**
 * Create a connection between two users.
 * - canonicalizes the pair so the smaller id is userA and the larger is userB
 * - checks for an existing connection and returns it if found
 * - attempts to create the row and handles concurrent unique-constraint races
 *
 * @param userId1 first user id initiating request
 * @param userId2 second user id
 * @
 */
export async function createConnection(userId1: number, userId2: number) {
  if (userId1 === userId2) {
    throw new Error('cannot create connection to self');
  }

  const [a, b] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  // Fast-path: check if a connection already exists for this canonical pair
  const existing = await prisma.connection.findUnique({
    where: {
      userAId_userBId: {
        userAId: a,
        userBId: b,
      },
    },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
  });

  if (existing) return existing;

  // Try to create; handle unique-constraint races by returning the existing row if it appears
  try {
    const created = await prisma.connection.create({
      data: {
        userAId: a,
        userBId: b,
        requester: userId1,
        // status will use the DB default (PENDING) if not provided
      },
      include: {
        userA: { select: connectionUserSelect },
        userB: { select: connectionUserSelect },
      },
    });
    return created;
  } catch (err: any) {
    // If another request created the same connection concurrently, the DB unique constraint
    // will trigger a Prisma P2002 error. In that case, fetch and return the existing row.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const found = await prisma.connection.findUnique({
        where: {
          userAId_userBId: {
            userAId: a,
            userBId: b,
          },
        },
        include: {
          userA: { select: connectionUserSelect },
          userB: { select: connectionUserSelect },
        },
      });
      if (found) return found;
    }
    throw err;
  }
}

export async function getConnectionById(id: number) {
  return await prisma.connection.findUnique({
    where: { id },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
  });
}

export async function listConnectionsForUser(userId: number) {
  return await prisma.connection.findMany({
    where: {
      OR: [
        { userAId: userId },
        { userBId: userId }
      ],
    },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * List accepted connections for a user (they are either userA or userB and status is ACCEPTED)
 */
export async function listAcceptedConnectionsForUser(userId: number) {
  return await prisma.connection.findMany({
    where: {
      OR: [
        { userAId: userId },
        { userBId: userId }
      ],
      status: 'ACCEPTED',
    },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function listAcceptedConnectionUserIds(userId: number) {
  const rows = await prisma.connection.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { userAId: userId },
        { userBId: userId },
      ],
    },
    select: {
      userAId: true,
      userBId: true,
    },
  });

  return rows.map((row) => (row.userAId === userId ? row.userBId : row.userAId));
}

/**
 * List incoming pending connections that the user needs to accept.
 * These are PENDING connections where the user is a participant and they are NOT the requester.
 */
export async function listIncomingPendingConnections(userId: number) {
  return await prisma.connection.findMany({
    where: {
      OR: [
        { userAId: userId },
        { userBId: userId }
      ],
      status: 'PENDING',
      NOT: {
        requester: userId,
      },
    },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function listOutgoingPendingConnections(userId: number) {
  return await prisma.connection.findMany({
    where: {
      status: 'PENDING',
      requester: userId,
      OR: [
        { userAId: userId },
        { userBId: userId },
      ],
    },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function acceptIncomingConnection(connectionId: number, userId: number) {
  const connection = await getConnectionById(connectionId)
  if (!connection) {
    throw new Error('connection not found')
  }

  const isParticipant = connection.userAId === userId || connection.userBId === userId
  if (!isParticipant) {
    throw new Error('not allowed to update this connection')
  }

  if (connection.requester === userId) {
    throw new Error('requester cannot accept their own request')
  }

  if (connection.status !== 'PENDING') {
    throw new Error('only pending requests can be accepted')
  }

  return await prisma.connection.update({
    where: { id: connectionId },
    data: { status: 'ACCEPTED' },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
  })
}

export async function rejectIncomingConnection(connectionId: number, userId: number) {
  const connection = await getConnectionById(connectionId)
  if (!connection) {
    throw new Error('connection not found')
  }

  const isParticipant = connection.userAId === userId || connection.userBId === userId
  if (!isParticipant) {
    throw new Error('not allowed to update this connection')
  }

  if (connection.requester === userId) {
    throw new Error('requester cannot reject their own request')
  }

  if (connection.status !== 'PENDING') {
    throw new Error('only pending requests can be rejected')
  }

  return await prisma.connection.delete({
    where: { id: connectionId },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
  })
}

/**
 * Block a user. `blockerId` will be stored in the `requester` field so only they can unblock.
 * This will create a new connection row with status BLOCKED if one doesn't exist, or update
 * the existing row to set status to BLOCKED and requester to the blocker.
 */
export async function blockUser(blockerId: number, blockedId: number) {
  if (blockerId === blockedId) {
    throw new Error('cannot block yourself');
  }

  const [a, b] = blockerId < blockedId ? [blockerId, blockedId] : [blockedId, blockerId];

  // Use upsert to atomically create or update the connection to BLOCKED
  const result = await prisma.connection.upsert({
    where: {
      userAId_userBId: {
        userAId: a,
        userBId: b,
      },
    },
    create: {
      userAId: a,
      userBId: b,
      requester: blockerId,
      status: 'BLOCKED',
    },
    update: {
      requester: blockerId,
      status: 'BLOCKED',
    },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
  });

  return result;
}

/**
 * List connections that the given user has blocked (they are the requester and status is BLOCKED).
 */
export async function listBlockedByUser(userId: number) {
  return await prisma.connection.findMany({
    where: {
      requester: userId,
      status: 'BLOCKED',
    },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * List connections where the given user has been blocked by someone else.
 */
export async function listUsersWhoBlockedUser(userId: number) {
  return await prisma.connection.findMany({
    where: {
      status: 'BLOCKED',
      NOT: { requester: userId },
      OR: [
        { userAId: userId },
        { userBId: userId },
      ],
    },
    include: {
      userA: { select: connectionUserSelect },
      userB: { select: connectionUserSelect },
    },
    orderBy: { updatedAt: 'desc' },
  });
}
