import { Router } from 'express';
import * as controller from './connection.controller';
import { authenticateJWT } from '../auth/auth.middleware';

const router = Router();

router.use(authenticateJWT);

// More specific list routes first to avoid being shadowed by param routes
// List accepted connections (friends)
router.get('/accepted', controller.listAcceptedConnectionsHandler);

// List incoming pending connection requests the user needs to accept
router.get('/pending/incoming', controller.listIncomingPendingConnectionsHandler);

// List outgoing pending connection requests the user already sent
router.get('/pending/outgoing', controller.listOutgoingPendingConnectionsHandler);

// List who the authenticated user has blocked
router.get('/blocked/by-me', controller.listBlockedByUserHandler);

// List who has blocked the authenticated user
router.get('/blocked/me', controller.listUsersWhoBlockedUserHandler);

// List all connections for the authenticated user
router.get('/', controller.listAllConnectionsHandler);

// Accept or reject an incoming pending request
router.post('/:id/accept', controller.acceptIncomingConnectionHandler);
router.post('/:id/reject', controller.rejectIncomingConnectionHandler);

// Create a connection request (initiator = req.user.id, target = :id)
router.post('/:id', controller.createConnectionHandler);

// Block a user
router.post('/:id/block', controller.blockUserHandler);

export default router;
