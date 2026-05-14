import express from "express";
import NotificationController from "../controllers/notificationController.js";
import { requireSelf } from "../middlewares/requireSelf.js";

const router = express.Router();

const targetFromParams = (req) => parseInt(req.params.userId, 10);

router.get(
    "/users/:userId/notifications",
    requireSelf(targetFromParams),
    NotificationController.list,
);

router.get(
    "/users/:userId/notifications/unread-count",
    requireSelf(targetFromParams),
    NotificationController.unreadCount,
);

router.patch("/notifications/:id/read", NotificationController.markRead);
router.post("/notifications/read-all", NotificationController.markAllRead);

export default router;
