import { Request, Response, NextFunction } from 'express';
import * as service from './content.service';

export async function uploadContent(req: Request, res: Response, next: NextFunction) {
  try {
    // get user id from authenticated request or fallback to body
    // @ts-ignore
    const userId = req.user?.id ?? (req.body.userId ? Number(req.body.userId) : undefined);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const file = req.file as Express.Multer.File | undefined;

    // A file is required for uploads — no fallback to body.publicId
    if (!file) return res.status(400).json({ error: 'file_required' });

    // upload file and get info
    const info = await service.uploadImageAndGetInfo(file);
    const publicId = info.publicId;
    const resourceType = info.resourceType;
    const uploadType = info.uploadType;

  const contentType = req.body.type ?? uploadType;
    const title = req.body.title;
    const description = req.body.description ?? '';
    const sharedWithNetwork = req.body.sharedWithNetwork === undefined ? undefined : (req.body.sharedWithNetwork === 'true' || req.body.sharedWithNetwork === true);
    const limit = req.body.limit ? Number(req.body.limit) : undefined;

    if (!publicId) return res.status(400).json({ error: 'publicId_required' });
    if (!contentType) return res.status(400).json({ error: 'type_required' });
    if (!title) return res.status(400).json({ error: 'title_required' });

    const created = await service.createContent(
      userId,
      publicId,
      resourceType ?? 'unknown',
      contentType,
      title,
      description,
      sharedWithNetwork,
      limit
    );

    return res.status(201).json(created);
  } catch (err: any) {
    if (err.message === 'content_limit_reached') return res.status(403).json({ error: err.message });
    if (err.message === 'publicId_required' || err.message === 'type_required' || err.message === 'title_required') return res.status(400).json({ error: err.message });
    return next(err);
  }
}

export async function getContentSignedUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const id = Number(req.params.id ?? req.body.id);
    if (!id || Number.isNaN(id)) return res.status(400).json({ error: 'invalid_content_id' });

  const url = await service.getSignedUrlForContent(id, userId);
  if (!url) return res.status(404).json({ error: 'not_found' });
  return res.status(200).json({ url });
  } catch (err) {
    return next(err);
  }
}

export async function toggleShare(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id ?? req.body.id);
    if (!id || Number.isNaN(id)) return res.status(400).json({ error: 'invalid_content_id' });

  const updated = await service.toggleShare(id);
  if (!updated) return res.status(404).json({ error: 'not_found' });
  return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function getContentByUser(req: Request, res: Response, next: NextFunction) {
  try {
    // prefer authenticated user
    // @ts-ignore
    const userId = req.user?.id ?? (req.params.userId ? Number(req.params.userId) : undefined);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

  const list = await service.listContentByUser(Number(userId));
  return res.status(200).json(list);
  } catch (err) {
    return next(err);
  }
}
