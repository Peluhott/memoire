import prisma from "../prisma/prisma";

export async function createScheduledDelivery(userId: number, scheduledFor: Date) {
  if (!Number.isInteger(userId)) {
    throw new Error("userId must be an integer");
  }

  return await prisma.delivery.create({
    data: {
      userId,
      scheduledFor,
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });
}

export async function getCurrentPendingDeliveryForUser(userId: number) {
  return await prisma.delivery.findFirst({
    where: {
      userId,
      status: "PENDING",
    },
    orderBy: [
      { scheduledFor: "asc" },
      { id: "asc" },
    ],
  });
}

export async function listDeliveriesForUser(userId: number) {
  return await prisma.delivery.findMany({
    where: { userId },
    orderBy: { scheduledFor: "desc" },
    include: {
      content: {
        select: {
          id: true,
          title: true,
        },
      },
      sharedContent: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function listPendingDeliveriesDue(asOf: Date) {
  return await prisma.delivery.findMany({
    where: {
      status: "PENDING",
      scheduledFor: {
        lte: asOf,
      },
    },
    orderBy: [
      { scheduledFor: "asc" },
      { id: "asc" },
    ],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });
}

export async function listSentDeliveriesForUser(userId: number) {
  return await prisma.delivery.findMany({
    where: {
      userId,
      status: "SENT",
    },
    select: {
      id: true,
      contentId: true,
      sharedContentId: true,
      scheduledFor: true,
    },
    orderBy: {
      scheduledFor: "asc",
    },
  });
}

export async function markDeliverySent(
  deliveryId: number,
  contentId: number,
  sharedContentId?: number | null,
) {
  return await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: "SENT",
      contentId,
      sharedContentId: sharedContentId ?? null,
    },
  });
}

export async function markDeliveryFailed(deliveryId: number) {
  return await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: "FAILED",
    },
  });
}

export async function markDeliveryInactive(deliveryId: number) {
  return await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: "INACTIVE",
    },
  });
}
