import prisma from "../prisma/prisma";
import { Prisma, Connection } from '@prisma/client';

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
export async function createConnection(userId1: number, userId2: number): Promise<Connection> {
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
      });
      if (found) return found;
    }
    throw err;
  }
}

export async function getConnectionById(id: number) {
  return await prisma.connection.findUnique({ where: { id } });
}

export async function listConnectionsForUser(userId: number) {
  return await prisma.connection.findMany({
    where: {
      OR: [
        { userAId: userId },
        { userBId: userId }
      ],
    },
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
  });
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
  });
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
  });
}
