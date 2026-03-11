import express from 'express';
import * as deliveryController from './delivery.controller';
import { authenticateJWT } from '../auth/auth.middleware';

const router = express.Router();

router.use(authenticateJWT);

// Note: sending deliveries is internal-only. The backend scheduler/worker
// should call the service directly — there is no public POST /deliveries route.

// GET /deliveries/active
router.get('/active', deliveryController.getActiveDeliveryHandler);

// GET /deliveries/history?take=20&skip=0
router.get('/history', deliveryController.getHistoryHandler);

// POST /deliveries/test-email
router.post('/test-email', deliveryController.sendTestEmailHandler);

// POST /deliveries/generated-email
router.post('/generated-email', deliveryController.sendGeneratedMessageEmailHandler);

// POST /deliveries/:id/open
router.post('/:id/open', deliveryController.openDeliveryHandler);

export default router;
