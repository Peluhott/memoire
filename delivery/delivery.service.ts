import prisma from '../prisma/prisma';
import * as deliveryRepo from './delivery.repository';

/**
 * Send a delivery: create it if there's no active delivery for the receiver.
 * Returns the delivery record (includes sender and content relations when available).
 */
export async function sendDelivery(contentId: number, receiverId: number, senderId: number) {
  // Basic validation mirroring the repository's checks
  if (!Number.isInteger(contentId) || !Number.isInteger(receiverId) || !Number.isInteger(senderId)) {
    throw new Error('ids must be integers');
  }

  const record = await deliveryRepo.createDelivery(contentId, receiverId, senderId);

  // Return a fresh read including relationships for API consumers
  return prisma.delivery.findUnique({
    where: { id: record.id },
    include: {
      sender: { select: { id: true, username: true, email: true } },
      content: { select: { id: true, title: true, public_id: true } },
    },
  });
}

export async function getActiveDeliveryForReceiver(receiverId: number) {
  if (!Number.isInteger(receiverId)) throw new Error('receiverId must be integer');
  return deliveryRepo.getActiveDeliveryForReceiver(receiverId);
}

/**
 * Mark a delivery as opened by the receiver. Only the receiver may open.
 * Increments timesSeen and sets dateSeen on the first open.
 */
export async function openDelivery(deliveryId: number, userId: number) {
  if (!Number.isInteger(deliveryId) || !Number.isInteger(userId)) {
    throw new Error('ids must be integers');
  }

  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) {
    const e: any = new Error('delivery not found');
    e.status = 404;
    throw e;
  }

  if (delivery.receiverId !== userId) {
    const e: any = new Error('only the receiver may open this delivery');
    e.status = 403;
    throw e;
  }

  if (delivery.status === 'EXPIRED') {
    const e: any = new Error('delivery has expired');
    e.status = 410;
    throw e;
  }

  const now = new Date();
  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      timesSeen: { increment: 1 },
      status: 'OPENED',
      dateSeen: delivery.dateSeen ?? now,
    },
    include: {
      sender: { select: { id: true, username: true, email: true } },
      content: { select: { id: true, title: true, public_id: true } },
    },
  });

  return updated;
}

/**
 * Expire deliveries that have passed their expiresAt timestamp.
 * Returns the number of deliveries marked as expired.
 */
export async function expireDueDeliveries() {
  const now = new Date();
  const result = await prisma.delivery.updateMany({
    where: { expiresAt: { lt: now }, status: { not: 'EXPIRED' } },
    data: { status: 'EXPIRED' },
  });

  return result.count;
}

/**
 * Return paginated history for a receiver.
 */
export async function getDeliveryHistory(receiverId: number, take = 20, skip = 0) {
  if (!Number.isInteger(receiverId)) throw new Error('receiverId must be integer');

  return prisma.delivery.findMany({
    where: { receiverId },
    orderBy: { dateSent: 'desc' },
    take,
    skip,
    include: {
      sender: { select: { id: true, username: true, email: true } },
      content: { select: { id: true, title: true, public_id: true } },
    },
  });
}

export default {
  sendDelivery,
  getActiveDeliveryForReceiver,
  openDelivery,
  expireDueDeliveries,
  getDeliveryHistory,
};
