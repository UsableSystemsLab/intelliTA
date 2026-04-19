const INSTRUCTOR_DOMAIN = "kau.edu.sa";
const STUDENT_DOMAIN = "stu.kau.edu.sa";

export const isKauEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith(`@${STUDENT_DOMAIN}`) ||
    normalized.endsWith(`@${INSTRUCTOR_DOMAIN}`)
  );
};

export const restrictToKauDomain = (req, res, next) => {
  const email = req.body?.email;
  if (!isKauEmail(email)) {
    return res.status(403).json({
      message:
        "Registration is currently limited to KAU students and instructors only. Please use your @stu.kau.edu.sa or @kau.edu.sa email.",
    });
  }
  next();
};
