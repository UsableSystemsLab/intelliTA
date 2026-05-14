// Opaque cursor helpers for keyset pagination on (created_at DESC, id DESC).
import { Op } from "sequelize";

export function encodeCursor(createdAt, id) {
    const payload = JSON.stringify({
        c: new Date(createdAt).toISOString(),
        i: id,
    });
    return Buffer.from(payload, "utf8").toString("base64url");
}

export function decodeCursor(raw) {
    if (!raw) return null;
    try {
        const json = Buffer.from(raw, "base64url").toString("utf8");
        const { c, i } = JSON.parse(json);
        if (!c || typeof i !== "number") return null;
        return { createdAt: new Date(c), id: i };
    } catch {
        return null;
    }
}

// Build a Sequelize where-clause that returns rows strictly older than the cursor,
// breaking ties by id so we never skip or repeat rows with identical timestamps.
export function cursorWhere(cursor, createdAtCol, idCol) {
    if (!cursor) return {};
    return {
        [Op.or]: [
            { [createdAtCol]: { [Op.lt]: cursor.createdAt } },
            {
                [createdAtCol]: cursor.createdAt,
                [idCol]: { [Op.lt]: cursor.id },
            },
        ],
    };
}

export function clampLimit(value, fallback = 20, max = 100) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.min(n, max);
}

export default { encodeCursor, decodeCursor, cursorWhere, clampLimit };
