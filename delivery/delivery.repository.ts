import prisma from '../prisma/prisma';


/**
 * Create a delivery record.
 * - lets DB defaults set dateSent, timesSeen and expiresAt
 * - returns the created Delivery record
 */
export async function createDelivery(
  contentId: number,
  receiverId: number,
  senderId: number,
) {
  // Basic validation
  if (!Number.isInteger(contentId) || !Number.isInteger(receiverId) || !Number.isInteger(senderId)) {
    throw new Error('ids must be integers');
  }

  // If a (non-expired) delivery already exists for this receiver, return it.
  // Assumption: at most one active delivery exists per receiver; "active"
  // means status is not EXPIRED and expiresAt is in the future.
  const now = new Date();
  const existing = await prisma.delivery.findFirst({
    where: {
      receiverId,
      status: { not: 'EXPIRED' },
      expiresAt: { gt: now },
    },
    orderBy: { dateSent: 'desc' },
  });

  if (existing) return existing;

  // Always create deliveries in the DELIVERED state. State transitions
  // (OPENED, EXPIRED, FAILED) should be performed by separate service
  // operations after creation.
  const record = await prisma.delivery.create({
    data: {
      contentId,
      receiverId,
      senderId,
      status: 'DELIVERED',
    },
  });

  return record;
}



/**
 * Return the single active delivery for a receiver, if any.
 * Active = status != EXPIRED and expiresAt > now()
 */
export async function getActiveDeliveryForReceiver(receiverId: number) {
  const now = new Date();
  return await prisma.delivery.findFirst({
    where: {
      receiverId,
      status: { not: 'EXPIRED' },
      expiresAt: { gt: now },
    },
    orderBy: { dateSent: 'desc' },
    include: {
      sender: { select: { id: true, username: true, email: true } },
      content: { select: { id: true, title: true, public_id: true } },
    },
  });
}
