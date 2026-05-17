import { resolveCallerUserId } from "../utils/resolveCaller.js";

// Factory: allow only the target user themselves through.
export function requireSelf(getTargetUserId) {
    return async (req, res, next) => {
        try {
            const targetUserId = await getTargetUserId(req);
            if (!Number.isInteger(targetUserId)) {
                return res.status(400).json({ error: "Invalid user id" });
            }

            const callerId = await resolveCallerUserId(req);
            if (!callerId) return res.status(401).json({ error: "Caller not registered" });
            if (callerId !== targetUserId) {
                return res.status(403).json({ error: "Forbidden" });
            }
            return next();
        } catch (err) {
            return next(err);
        }
    };
}

export default requireSelf;
