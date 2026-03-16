import { Resend } from "resend";
import * as deliveryRepo from "./delivery.repository";
import * as contentService from "../content/content.service";
import { getChatCompletion } from "../util/chatcompletion";
import { getSignedImageUrl } from "../util/getSignedImage";
import { randomNextWeekday } from "../util/randomNextWeekday";

type MemoryContent = {
  id: number;
  title: string;
  description: string;
  public_id: string;
  resource_type: string;
  uploaded_at: Date;
};

type SharedMemoryContent = MemoryContent & {
  user?: {
    id: number;
    username: string;
    name: string | null;
  };
};

function choosePrimaryContent(
  ownedContent: MemoryContent[],
  sentDeliveries: Array<{ contentId: number | null }>,
) {
  if (ownedContent.length === 0) {
    const error: any = new Error("user has no content to deliver");
    error.status = 400;
    throw error;
  }

  const sentContentIds = new Set(
    sentDeliveries
      .map((delivery) => delivery.contentId)
      .filter((contentId): contentId is number => Number.isInteger(contentId)),
  );

  const unseen = ownedContent.filter((item) => !sentContentIds.has(item.id));
  if (unseen.length > 0) {
    return unseen[0];
  }

  const sendCounts = new Map<number, number>();
  for (const delivery of sentDeliveries) {
    if (typeof delivery.contentId === "number") {
      sendCounts.set(
        delivery.contentId,
        (sendCounts.get(delivery.contentId) ?? 0) + 1,
      );
    }
  }

  return ownedContent.reduce((leastSeen, current) => {
    const currentCount = sendCounts.get(current.id) ?? 0;
    const leastCount = sendCounts.get(leastSeen.id) ?? 0;
    if (currentCount < leastCount) {
      return current;
    }
    return leastSeen;
  }, ownedContent[0]);
}

function chooseSharedContent(
  sharedContent: SharedMemoryContent[],
  sentDeliveries: Array<{ sharedContentId: number | null }>,
) {
  if (sharedContent.length === 0) {
    return null;
  }

  const sentSharedIds = new Set(
    sentDeliveries
      .map((delivery) => delivery.sharedContentId)
      .filter((contentId): contentId is number => Number.isInteger(contentId)),
  );

  const unseen = sharedContent.filter((item) => !sentSharedIds.has(item.id));
  if (unseen.length > 0) {
    return unseen[0];
  }

  return sharedContent[Math.floor(Math.random() * sharedContent.length)];
}

function buildPromptForMemory(
  primaryContent: MemoryContent,
  sharedContent?: SharedMemoryContent | null,
) {
  if (!sharedContent) {
    return `Primary memory title: ${primaryContent.title}\nPrimary memory description: ${primaryContent.description || "No description provided."}\nWrite one short warm note that brings this memory back naturally.`;
  }

  const sharedBy =
    sharedContent.user?.name ??
    sharedContent.user?.username ??
    "someone in their network";
  return `Primary memory title: ${primaryContent.title}\nPrimary memory description: ${primaryContent.description || "No description provided."}\nShared memory title: ${sharedContent.title}\nShared memory description: ${sharedContent.description || "No description provided."}\nShared by: ${sharedBy}\nWrite a short warm email note that first brings back the user's own memory and then briefly introduces the shared memory from their network.`;
}

function buildDeliveryEmailHtml(
  message: string,
  primaryContent: MemoryContent,
  sharedContent?: SharedMemoryContent | null,
) {
  const primaryImageUrl = getSignedImageUrl(
    primaryContent.public_id,
    primaryContent.resource_type,
  );

  if (!sharedContent) {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h1>Memoire</h1>
        <p>${message}</p>
        <section style="margin-top: 24px;">
          <h2 style="margin-bottom: 8px;">${primaryContent.title}</h2>
          <p>${primaryContent.description || "No description provided."}</p>
          <img src="${primaryImageUrl}" alt="${primaryContent.title}" style="display:block; max-width:100%; margin-top:16px; border-radius:16px;" />
        </section>
      </div>
    `;
  }

  const sharedImageUrl = getSignedImageUrl(
    sharedContent.public_id,
    sharedContent.resource_type,
  );
  const sharedBy =
    sharedContent.user?.name ?? sharedContent.user?.username ?? "Your network";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h1>Memoire</h1>
      <p>${message}</p>
      <section style="margin-top: 24px;">
        <h2 style="margin-bottom: 8px;">Your memory: ${primaryContent.title}</h2>
        <p>${primaryContent.description || "No description provided."}</p>
        <img src="${primaryImageUrl}" alt="${primaryContent.title}" style="display:block; max-width:100%; margin-top:16px; border-radius:16px;" />
      </section>
      <section style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
        <h2 style="margin-bottom: 8px;">From your shared network: ${sharedContent.title}</h2>
        <p>Shared by ${sharedBy}.</p>
        <p>${sharedContent.description || "No description provided."}</p>
        <img src="${sharedImageUrl}" alt="${sharedContent.title}" style="display:block; max-width:100%; margin-top:16px; border-radius:16px;" />
      </section>
    </div>
  `;
}

async function sendHtmlEmail(email: string, subject: string, html: string) {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    const error: any = new Error("email is required");
    error.status = 400;
    throw error;
  }

  if (!html.trim()) {
    const error: any = new Error("html is required");
    error.status = 400;
    throw error;
  }

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
    subject,
    html,
  });

  if (error) {
    const sendError: any = new Error(error.message);
    sendError.status = 502;
    throw sendError;
  }

  return data;
}

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

export async function deactivateCurrentPendingDelivery(userId: number) {
  if (!Number.isInteger(userId)) {
    throw new Error("userId must be an integer");
  }

  const delivery = await deliveryRepo.getCurrentPendingDeliveryForUser(userId);
  if (!delivery) {
    const error: any = new Error("no pending delivery found");
    error.status = 404;
    throw error;
  }

  return await deliveryRepo.markDeliveryInactive(delivery.id);
}

export async function generateAndSendMessageEmail(
  email: string,
  title: string,
  description: string,
  publicId?: string,
  resourceType?: string,
) {
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (!trimmedTitle) {
    const error: any = new Error("title is required");
    error.status = 400;
    throw error;
  }

  const prompt = `Title: ${trimmedTitle}\nDescription: ${trimmedDescription || "No description provided."}`;
  const message = (await getChatCompletion(prompt)).trim();

  if (!message) {
    const error: any = new Error("generated message was empty");
    error.status = 502;
    throw error;
  }

  const imageUrl =
    publicId && resourceType
      ? getSignedImageUrl(publicId, resourceType)
      : undefined;
  const trimmedImageUrl = imageUrl?.trim();
  const result = await sendHtmlEmail(
    email,
    "testing to see if it works",
    `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h1>Memoire test email</h1>
        <p>${message}</p>
        ${
          trimmedImageUrl
            ? `<img src="${trimmedImageUrl}" alt="Memory photo" style="display:block; max-width:100%; margin-top:16px; border-radius:16px;" />`
            : ""
        }
      </div>
    `,
  );

  return {
    message,
    result,
  };
}

export async function processPendingDeliveries(asOf = new Date()) {
  const dueDeliveries = await deliveryRepo.listPendingDeliveriesDue(asOf);
  const results = [];

  for (const delivery of dueDeliveries) {
    try {
      const ownedContent = await contentService.listContentSummariesByUser(
        delivery.userId,
      );
      const sentDeliveries = await deliveryRepo.listSentDeliveriesForUser(
        delivery.userId,
      );
      const primaryContent = choosePrimaryContent(ownedContent, sentDeliveries);
      const sharedContent = chooseSharedContent(
        await contentService.listAccessibleSharedContent(delivery.userId),
        sentDeliveries,
      );
      const prompt = buildPromptForMemory(primaryContent, sharedContent);
      const message = (await getChatCompletion(prompt)).trim();

      if (!message) {
        throw new Error("generated message was empty");
      }

      const html = buildDeliveryEmailHtml(
        message,
        primaryContent,
        sharedContent,
      );
      const emailResult = await sendHtmlEmail(
        delivery.user.email,
        "A memory from Memoire",
        html,
      );

      await deliveryRepo.markDeliverySent(
        delivery.id,
        primaryContent.id,
        sharedContent?.id ?? null,
      );

      results.push({
        deliveryId: delivery.id,
        userId: delivery.userId,
        status: "SENT",
        contentId: primaryContent.id,
        sharedContentId: sharedContent?.id ?? null,
        emailId: emailResult?.id ?? null,
      });
    } catch (error: any) {
      await deliveryRepo.markDeliveryFailed(delivery.id);
      results.push({
        deliveryId: delivery.id,
        userId: delivery.userId,
        status: "FAILED",
        error: error.message,
      });
    }
  }

  return results;
}

export default {
  scheduleRandomDelivery,
  getDeliveryHistory,
  deactivateCurrentPendingDelivery,
  generateAndSendMessageEmail,
  processPendingDeliveries,
};
