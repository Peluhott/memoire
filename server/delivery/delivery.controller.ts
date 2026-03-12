import { Request, Response } from 'express';
import deliveryService from './delivery.service';
import * as userRepository from '../user/user.repository';

export async function getActiveDeliveryHandler(req: Request, res: Response) {
  const receiverId = req.user?.id;
  if (!receiverId) return res.status(401).json({ error: 'authentication required' });

  try {
    const delivery = await deliveryService.getActiveDeliveryForReceiver(Number(receiverId));
    if (!delivery) return res.status(204).send();
    return res.json(delivery);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getHistoryHandler(req: Request, res: Response) {
  const receiverId = req.user?.id;
  if (!receiverId) return res.status(401).json({ error: 'authentication required' });

  const take = Number(req.query.take ?? 20);
  const skip = Number(req.query.skip ?? 0);

  try {
    const items = await deliveryService.getDeliveryHistory(Number(receiverId), take, skip);
    return res.json({ items });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function openDeliveryHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  const deliveryId = Number(req.params.id);
  if (!userId) return res.status(401).json({ error: 'authentication required' });

  try {
    const updated = await deliveryService.openDelivery(deliveryId, Number(userId));
    return res.json(updated);
  } catch (err: any) {
    const status = err?.status || 400;
    return res.status(status).json({ error: err.message });
  }
}

export async function sendTestEmailHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'authentication required' });

  try {
    const user = await userRepository.getUserById(Number(userId));
    if (!user?.email) return res.status(404).json({ error: 'user email not found' });

    const result = await deliveryService.sendTestEmail(
      user.email,
      'This is a delivery service test from the Memoire backend. If you received this, the email route is working.',
    );
    return res.status(200).json({ message: 'email sent', result });
  } catch (err: any) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message });
  }
}

export async function sendGeneratedMessageEmailHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'authentication required' });

  const title = typeof req.body.title === 'string' ? req.body.title : '';
  const description = typeof req.body.description === 'string' ? req.body.description : '';
  const publicId = typeof req.body.publicId === 'string' ? req.body.publicId : '';
  const resourceType = typeof req.body.resourceType === 'string' ? req.body.resourceType : '';

  try {
    console.log('[delivery.sendGeneratedMessageEmailHandler] request received', {
      userId,
      title,
      hasDescription: Boolean(description),
      hasEmbeddedImage: Boolean(publicId && resourceType),
    });
    const user = await userRepository.getUserById(Number(userId));
    if (!user?.email) return res.status(404).json({ error: 'user email not found' });

    const result = await deliveryService.generateAndSendMessageEmail(
      user.email,
      title,
      description,
      publicId,
      resourceType,
    );

    return res.status(200).json({
      message: 'generated email sent',
      generatedMessage: result.message,
      result: result.result,
    });
  } catch (err: any) {
    console.error('[delivery.sendGeneratedMessageEmailHandler] failed', {
      userId,
      title,
      error: err?.message,
      status: err?.status,
    });
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message });
  }
}
