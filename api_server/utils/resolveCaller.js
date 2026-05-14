import User from "../models/User.js";

// Map req.firebaseUser.uid → users.user_id.
// Returns null when the firebase user is not registered locally.
export async function resolveCallerUserId(req) {
    if (req.callerUserId !== undefined) return req.callerUserId;
    const firebaseUid = req.firebaseUser?.uid;
    if (!firebaseUid) return null;
    const user = await User.findOne({
        where: { firebaseId: firebaseUid },
        attributes: ["id"],
    });
    req.callerUserId = user ? user.id : null;
    return req.callerUserId;
}

export default { resolveCallerUserId };
