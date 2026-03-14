import { Request, Response } from "express";
import deliveryService from "./delivery.service";
import * as userRepository from "../user/user.repository";

export async function createScheduledDeliveryHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "authentication required" });
  }

  try {
    const delivery = await deliveryService.scheduleRandomDelivery(Number(userId));
    return res.status(201).json(delivery);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getHistoryHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "authentication required" });
  }

  try {
    const items = await deliveryService.getDeliveryHistory(Number(userId));
    return res.json({ items });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function processPendingDeliveriesHandler(_req: Request, res: Response) {
  try {
    const deliveries = await deliveryService.processPendingDeliveries();
    return res.status(200).json({ deliveries });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function sendGeneratedMessageEmailHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "authentication required" });
  }

  const title = typeof req.body.title === "string" ? req.body.title : "";
  const description = typeof req.body.description === "string" ? req.body.description : "";
  const publicId = typeof req.body.publicId === "string" ? req.body.publicId : "";
  const resourceType = typeof req.body.resourceType === "string" ? req.body.resourceType : "";

  try {
    const user = await userRepository.getUserById(Number(userId));
    if (!user?.email) {
      return res.status(404).json({ error: "user email not found" });
    }

    const result = await deliveryService.generateAndSendMessageEmail(
      user.email,
      title,
      description,
      publicId,
      resourceType,
    );

    return res.status(200).json({
      message: "generated email sent",
      generatedMessage: result.message,
      result: result.result,
    });
  } catch (err: any) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message });
  }
}
