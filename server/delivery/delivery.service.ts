import { Resend } from "resend";
import * as deliveryRepo from "./delivery.repository";
import { getChatCompletion } from "../util/chatcompletion";
import { getSignedImageUrl } from "../util/getSignedImage";
import { randomNextWeekday } from "../util/randomNextWeekday";

export async function scheduleRandomDelivery(userId: number) {
  if (!Number.isInteger(userId)) {
    throw new Error("userId must be an integer");
  }

  const scheduledFor = randomNextWeekday();
  return await deliveryRepo.createScheduledDelivery(userId, scheduledFor);
}

export async function getDeliveryHistory(userId: number) {
  if (!Number.isInteger(userId)) {
    throw new Error("userId must be an integer");
  }

  return await deliveryRepo.listDeliveriesForUser(userId);
}

export async function getUsersNeedingDelivery(asOf = new Date()) {
  const dueDeliveries = await deliveryRepo.listPendingDeliveriesDue(asOf);
  const userIds = [
    ...new Set(dueDeliveries.map((delivery) => delivery.userId)),
  ];

  return userIds;
}

export async function listPendingDeliveriesDue(asOf = new Date()) {
  return await deliveryRepo.listPendingDeliveriesDue(asOf);
}

export async function sendTestEmail(
  email: string,
  message: string,
  imageUrl?: string,
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

  const trimmedImageUrl = imageUrl?.trim();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const error: any = new Error("RESEND_API_KEY is not configured");
    error.status = 500;
    throw error;
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: [trimmedEmail],
    subject: "testing to see if it works",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h1>Memoire test email</h1>
        <p>${trimmedMessage}</p>
        ${
          trimmedImageUrl
            ? `<img src="${trimmedImageUrl}" alt="Memory photo" style="display:block; max-width:100%; margin-top:16px; border-radius:16px;" />`
            : ""
        }
      </div>
    `,
  });

  if (error) {
    const sendError: any = new Error(error.message);
    sendError.status = 502;
    throw sendError;
  }

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
  const message = await getChatCompletion(prompt);

  if (!message.trim()) {
    const error: any = new Error("generated message was empty");
    error.status = 502;
    throw error;
  }

  return message.trim();
}

export async function generateAndSendMessageEmail(
  email: string,
  title: string,
  description: string,
  publicId?: string,
  resourceType?: string,
) {
  const message = await generateMessageFromImage(title, description);
  const imageUrl =
    publicId && resourceType
      ? getSignedImageUrl(publicId, resourceType)
      : undefined;
  const result = await sendTestEmail(email, message, imageUrl);

  return {
    message,
    result,
  };
}

export default {
  scheduleRandomDelivery,
  getDeliveryHistory,
  getUsersNeedingDelivery,
  listPendingDeliveriesDue,
  sendTestEmail,
  generateMessageFromImage,
  generateAndSendMessageEmail,
};
