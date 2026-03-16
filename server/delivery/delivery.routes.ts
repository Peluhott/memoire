import express from 'express';
import * as deliveryController from './delivery.controller';
import { authenticateJWT } from '../auth/auth.middleware';

const router = express.Router();

router.use(authenticateJWT);

// POST /deliveries/schedule
router.post('/schedule', deliveryController.createScheduledDeliveryHandler);

// GET /deliveries/history
router.get('/history', deliveryController.getHistoryHandler);

// POST /deliveries/process-pending
router.post('/process-pending', deliveryController.processPendingDeliveriesHandler);

// POST /deliveries/generated-email
router.post('/generated-email', deliveryController.sendGeneratedMessageEmailHandler);

export default router;
