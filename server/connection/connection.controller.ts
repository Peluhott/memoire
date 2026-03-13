import { Request, Response, NextFunction } from 'express';
import * as service from './connection.service';

// Authentication middleware is expected to populate `req.user`.
// Controllers use `req.user!.id` (non-null assertion) because middleware should
// reject unauthenticated requests before they reach these handlers.

export async function createConnectionHandler(req: Request, res: Response, next: NextFunction) {
  try {
  const initiatorId = req.user!.id;

    const targetId = parseInt(req.params.id, 10);
    if (!Number.isInteger(targetId)) return res.status(400).json({ error: 'invalid target id' });

    const conn = await service.createConnection(initiatorId, targetId);
    return res.status(201).json(conn);
  } catch (err) {
    return next(err);
  }
}



export async function listAllConnectionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
  const rows = await service.listAllConnections(req.user!.id);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

export async function listAcceptedConnectionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
  const rows = await service.listAcceptedConnections(req.user!.id);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

export async function listIncomingPendingConnectionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
  const rows = await service.listIncomingPendingConnections(req.user!.id);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

export async function listOutgoingPendingConnectionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await service.listOutgoingPendingConnections(req.user!.id);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

export async function acceptIncomingConnectionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const connectionId = parseInt(req.params.id, 10);
    if (!Number.isInteger(connectionId)) return res.status(400).json({ error: 'invalid connection id' });

    const result = await service.acceptIncomingConnection(connectionId, req.user!.id);
    return res.status(200).json(result);
  } catch (err: any) {
    const status = [
      'connection not found',
      'not allowed to update this connection',
      'requester cannot accept their own request',
      'only pending requests can be accepted',
    ].includes(err.message)
      ? 400
      : 500

    return res.status(status).json({ error: err.message })
  }
}

export async function rejectIncomingConnectionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const connectionId = parseInt(req.params.id, 10);
    if (!Number.isInteger(connectionId)) return res.status(400).json({ error: 'invalid connection id' });

    const result = await service.rejectIncomingConnection(connectionId, req.user!.id);
    return res.status(200).json(result);
  } catch (err: any) {
    const status = [
      'connection not found',
      'not allowed to update this connection',
      'requester cannot reject their own request',
      'only pending requests can be rejected',
    ].includes(err.message)
      ? 400
      : 500

    return res.status(status).json({ error: err.message })
  }
}

export async function blockUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
  const blockerId = req.user!.id;
    const blockedId = parseInt(req.params.id, 10);
    if (!Number.isInteger(blockedId)) return res.status(400).json({ error: 'invalid target id' });

    const result = await service.blockUser(blockerId, blockedId);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function listBlockedByUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
  const rows = await service.listBlockedByUser(req.user!.id);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

export async function listUsersWhoBlockedUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
  const rows = await service.listUsersWhoBlockedUser(req.user!.id);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}
