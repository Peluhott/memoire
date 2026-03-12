import prisma from "../prisma/prisma";
import { Resend } from "resend";
import * as deliveryRepo from "./delivery.repository";
import { getChatCompletion } from "../util/chatcompletion";
import { getSignedImageUrl } from "../util/getSignedImage";

/**
 * Send a delivery: create it if there's no active delivery for the receiver.
 * Returns the delivery record (includes sender and content relations when available).
 */
export async function sendDelivery(
  contentId: number,
  receiverId: number,
  senderId: number,
) {
  // Basic validation mirroring the repository's checks
  if (
    !Number.isInteger(contentId) ||
    !Number.isInteger(receiverId) ||
    !Number.isInteger(senderId)
  ) {
    throw new Error("ids must be integers");
  }

  const record = await deliveryRepo.createDelivery(
    contentId,
    receiverId,
    senderId,
  );

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
  if (!Number.isInteger(receiverId))
    throw new Error("receiverId must be integer");
  return deliveryRepo.getActiveDeliveryForReceiver(receiverId);
}

/**
 * Mark a delivery as opened by the receiver. Only the receiver may open.
 * Increments timesSeen and sets dateSeen on the first open.
 */
export async function openDelivery(deliveryId: number, userId: number) {
  if (!Number.isInteger(deliveryId) || !Number.isInteger(userId)) {
    throw new Error("ids must be integers");
  }

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
  });
  if (!delivery) {
    const e: any = new Error("delivery not found");
    e.status = 404;
    throw e;
  }

  if (delivery.receiverId !== userId) {
    const e: any = new Error("only the receiver may open this delivery");
    e.status = 403;
    throw e;
  }

  if (delivery.status === "EXPIRED") {
    const e: any = new Error("delivery has expired");
    e.status = 410;
    throw e;
  }

  const now = new Date();
  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      timesSeen: { increment: 1 },
      status: "OPENED",
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
    where: { expiresAt: { lt: now }, status: { not: "EXPIRED" } },
    data: { status: "EXPIRED" },
  });

  return result.count;
}

/**
 * Return paginated history for a receiver.
 */
export async function getDeliveryHistory(
  receiverId: number,
  take = 20,
  skip = 0,
) {
  if (!Number.isInteger(receiverId))
    throw new Error("receiverId must be integer");

  return prisma.delivery.findMany({
    where: { receiverId },
    orderBy: { dateSent: "desc" },
    take,
    skip,
    include: {
      sender: { select: { id: true, username: true, email: true } },
      content: { select: { id: true, title: true, public_id: true } },
    },
  });
}

export async function sendTestEmail(
  email: string,
  message: string,
  attachmentPath?: string,
) {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    const error: any = new Error("email is required");
    error.status = 400;
    throw error;
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    const error: any = new Error("message is required");
    error.status = 400;
    throw error;
  }

  const trimmedAttachmentPath = attachmentPath?.trim();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const error: any = new Error("RESEND_API_KEY is not configured");
    error.status = 500;
    throw error;
  }

  const resend = new Resend(apiKey);
  console.log("[delivery.sendTestEmail] sending email", {
    to: trimmedEmail,
    subject: "testing to see if it works",
    hasAttachment: Boolean(trimmedAttachmentPath),
  });
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: [trimmedEmail],
    subject: "testing to see if it works",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h1>Memoire test email</h1>
        <p>${trimmedMessage}</p>
      </div>
    `,
    attachments: trimmedAttachmentPath
      ? [
          {
            path: trimmedAttachmentPath,
            filename: "memory.jpg",
          },
        ]
      : undefined,
  });

  if (error) {
    console.error("[delivery.sendTestEmail] resend error", {
      to: trimmedEmail,
      error,
    });
    const sendError: any = new Error(error.message);
    sendError.status = 502;
    throw sendError;
  }

  console.log("[delivery.sendTestEmail] email sent", {
    to: trimmedEmail,
    id: data?.id,
  });
  return data;
}

export async function generateMessageFromImage(
  title: string,
  description: string,
) {
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (!trimmedTitle) {
    const error: any = new Error("title is required");
    error.status = 400;
    throw error;
  }

  const prompt = `Title: ${trimmedTitle}\nDescription: ${trimmedDescription || "No description provided."}`;
  console.log("[delivery.generateMessageFromImage] generating message", {
    title: trimmedTitle,
    hasDescription: Boolean(trimmedDescription),
  });
  const message = await getChatCompletion(prompt);

  if (!message.trim()) {
    const error: any = new Error("generated message was empty");
    error.status = 502;
    throw error;
  }

  console.log("[delivery.generateMessageFromImage] message generated", {
    title: trimmedTitle,
    preview: message.slice(0, 80),
  });
  return message.trim();
}

export async function generateAndSendMessageEmail(
  email: string,
  title: string,
  description: string,
  publicId?: string,
  resourceType?: string,
) {
  console.log("[delivery.generateAndSendMessageEmail] start", {
    to: email,
    title,
  });
  const message = await generateMessageFromImage(title, description);
  const attachmentPath =
    publicId && resourceType ? getSignedImageUrl(publicId, resourceType) : undefined;
  const result = await sendTestEmail(email, message, attachmentPath);

  console.log("[delivery.generateAndSendMessageEmail] complete", {
    to: email,
    title,
    id: result?.id,
    hasAttachment: Boolean(attachmentPath),
  });
  return {
    message,
    result,
  };
}

export default {
  sendDelivery,
  getActiveDeliveryForReceiver,
  openDelivery,
  expireDueDeliveries,
  getDeliveryHistory,
  sendTestEmail,
  generateMessageFromImage,
  generateAndSendMessageEmail,
};
