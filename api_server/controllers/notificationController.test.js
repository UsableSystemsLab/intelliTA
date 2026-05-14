jest.mock("../models/Notification.js", () => ({
    __esModule: true,
    default: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
    },
}));
jest.mock("../utils/resolveCaller.js", () => ({
    __esModule: true,
    resolveCallerUserId: jest.fn(),
}));

import { mockReq, mockRes } from "../__tests__/helpers/mockReqRes.js";
import Notification from "../models/Notification.js";
import { resolveCallerUserId } from "../utils/resolveCaller.js";
import NotificationController from "./notificationController.js";

const makeRow = (over = {}) => ({
    notification_id: 1,
    user_id: 5,
    type: "POINTS_EARNED",
    title: "t",
    body: "b",
    metadata: null,
    is_read: false,
    read_at: null,
    created_at: new Date("2026-01-01T00:00:00Z"),
    save: jest.fn().mockResolvedValue(),
    ...over,
});

describe("NotificationController.list", () => {
    test("returns items and a next_cursor when there is another page", async () => {
        const rows = Array.from({ length: 21 }, (_, i) =>
            makeRow({ notification_id: 100 - i, created_at: new Date(2026, 0, 1, 0, 0, 0, 21 - i) })
        );
        Notification.findAll.mockResolvedValue(rows);
        const req = mockReq({ params: { userId: "5" }, query: { limit: "20" } });
        const res = mockRes();
        await NotificationController.list(req, res);
        const body = res.json.mock.calls[0][0];
        expect(body.items).toHaveLength(20);
        expect(body.next_cursor).not.toBeNull();
    });

    test("unread_only filter applies", async () => {
        Notification.findAll.mockResolvedValue([]);
        const req = mockReq({ params: { userId: "5" }, query: { unread_only: "true" } });
        const res = mockRes();
        await NotificationController.list(req, res);
        const args = Notification.findAll.mock.calls[0][0];
        expect(args.where.is_read).toBe(false);
    });
});

describe("NotificationController.unreadCount", () => {
    test("returns count", async () => {
        Notification.count.mockResolvedValue(4);
        const req = mockReq({ params: { userId: "5" } });
        const res = mockRes();
        await NotificationController.unreadCount(req, res);
        expect(res.json).toHaveBeenCalledWith({ count: 4 });
    });
});

describe("NotificationController.markRead", () => {
    test("marks and returns the notification", async () => {
        resolveCallerUserId.mockResolvedValue(5);
        const row = makeRow();
        Notification.findByPk.mockResolvedValue(row);
        const req = mockReq({ params: { id: "1" } });
        const res = mockRes();
        await NotificationController.markRead(req, res);
        expect(row.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0].is_read).toBe(true);
    });

    test("403 when caller does not own the notification", async () => {
        resolveCallerUserId.mockResolvedValue(99);
        Notification.findByPk.mockResolvedValue(makeRow());
        const req = mockReq({ params: { id: "1" } });
        const res = mockRes();
        await NotificationController.markRead(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test("404 when notification is missing", async () => {
        resolveCallerUserId.mockResolvedValue(5);
        Notification.findByPk.mockResolvedValue(null);
        const req = mockReq({ params: { id: "1" } });
        const res = mockRes();
        await NotificationController.markRead(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test("400 on invalid id", async () => {
        const req = mockReq({ params: { id: "abc" } });
        const res = mockRes();
        await NotificationController.markRead(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("NotificationController.markAllRead", () => {
    test("returns updated_count", async () => {
        resolveCallerUserId.mockResolvedValue(5);
        Notification.update.mockResolvedValue([7]);
        const req = mockReq();
        const res = mockRes();
        await NotificationController.markAllRead(req, res);
        expect(res.json).toHaveBeenCalledWith({ updated_count: 7 });
    });
});
