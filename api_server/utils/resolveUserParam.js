import User from "../models/User.js";

export async function resolveUserParam(value) {
    if (value == null) return null;
    const str = String(value);
    if (str === "") return null;
    if (/^\d+$/.test(str)) return parseInt(str, 10);
    const user = await User.findOne({
        where: { firebaseId: str },
        attributes: ["id"],
    });
    return user ? user.id : null;
}

export default resolveUserParam;
