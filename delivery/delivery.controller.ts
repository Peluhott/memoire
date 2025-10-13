import { Request, Response } from 'express';
import deliveryService from './delivery.service';

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
