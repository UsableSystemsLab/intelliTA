import { resolveCallerUserId } from "../utils/resolveCaller.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

// Factory: allow the request if the caller is the target user themselves,
// or an instructor of any course the target user is enrolled in.
//
//   router.get(
//     "/:userId/rewards",
//     requireSelfOrInstructorOf((req) => parseInt(req.params.userId, 10)),
//     handler,
//   );
export function requireSelfOrInstructorOf(getTargetUserId) {
    return async (req, res, next) => {
        try {
            const targetUserId = await getTargetUserId(req);
            if (!Number.isInteger(targetUserId)) {
                return res.status(400).json({ error: "Invalid user id" });
            }

            const callerId = await resolveCallerUserId(req);
            if (!callerId) return res.status(401).json({ error: "Caller not registered" });

            if (callerId === targetUserId) return next();

            const enrollments = await Enrollment.findAll({
                where: { user_id: targetUserId },
                attributes: ["course_id"],
            });
            if (enrollments.length === 0) {
                return res.status(403).json({ error: "Forbidden" });
            }

            const teaches = await Course.count({
                where: {
                    instructor_id: callerId,
                    course_id: enrollments.map((e) => e.course_id),
                },
            });
            if (teaches > 0) return next();

            return res.status(403).json({ error: "Forbidden" });
        } catch (err) {
            return next(err);
        }
    };
}

export default requireSelfOrInstructorOf;
