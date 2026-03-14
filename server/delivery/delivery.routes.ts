import express from 'express';
import * as deliveryController from './delivery.controller';
import { authenticateJWT } from '../auth/auth.middleware';

const router = express.Router();

router.use(authenticateJWT);

// POST /deliveries/schedule
router.post('/schedule', deliveryController.createScheduledDeliveryHandler);

// GET /deliveries/history
router.get('/history', deliveryController.getHistoryHandler);

// GET /deliveries/due-users
router.get('/due-users', deliveryController.getDueUsersHandler);

// POST /deliveries/test-email
router.post('/test-email', deliveryController.sendTestEmailHandler);

// POST /deliveries/generated-email
router.post('/generated-email', deliveryController.sendGeneratedMessageEmailHandler);

export default router;
