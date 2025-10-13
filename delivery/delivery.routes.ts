import express from 'express';
import * as deliveryController from './delivery.controller';

const router = express.Router();

// Note: sending deliveries is internal-only. The backend scheduler/worker
// should call the service directly — there is no public POST /deliveries route.

// GET /deliveries/active
router.get('/active', deliveryController.getActiveDeliveryHandler);

// GET /deliveries/history?take=20&skip=0
router.get('/history', deliveryController.getHistoryHandler);

// POST /deliveries/:id/open
router.post('/:id/open', deliveryController.openDeliveryHandler);

export default router;
