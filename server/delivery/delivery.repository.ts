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
