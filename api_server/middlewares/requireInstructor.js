import { resolveCallerUserId } from "../utils/resolveCaller.js";
import Course from "../models/Course.js";

// Allow the request if the caller teaches at least one course.
// Stashes the resolved caller user_id on req.callerUserId.
export async function requireInstructor(req, res, next) {
    try {
        const callerId = await resolveCallerUserId(req);
        if (!callerId) return res.status(401).json({ error: "Caller not registered" });

        const taught = await Course.count({ where: { instructor_id: callerId } });
        if (taught === 0) return res.status(403).json({ error: "Instructor role required" });

        return next();
    } catch (err) {
        return next(err);
    }
}

export default requireInstructor;
