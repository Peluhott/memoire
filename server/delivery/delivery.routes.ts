import express from "express";
import * as deliveryController from "./delivery.controller";
import { authenticateJWT } from "../auth/auth.middleware";
import { authenticateCronSecret } from "../auth/cron.middleware";

const router = express.Router();

// POST /deliveries/schedule
router.post(
  "/schedule",
  authenticateJWT,
  deliveryController.createScheduledDeliveryHandler,
);

// GET /deliveries/history
router.get("/history", authenticateJWT, deliveryController.getHistoryHandler);

// POST /deliveries/deactivate-current
router.post(
  "/deactivate-current",
  authenticateJWT,
  deliveryController.deactivateCurrentPendingDeliveryHandler,
);

// POST /deliveries/process-pending
router.post(
  "/process-pending",
  authenticateCronSecret,
  deliveryController.processPendingDeliveriesHandler,
);

// POST /deliveries/generated-email
router.post(
  "/generated-email",
  authenticateJWT,
  deliveryController.sendGeneratedMessageEmailHandler,
);

export default router;
