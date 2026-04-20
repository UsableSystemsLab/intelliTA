export const KAU_INSTRUCTOR_DOMAIN = "kau.edu.sa";
export const KAU_STUDENT_DOMAIN = "stu.kau.edu.sa";

export const isKauEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith(`@${KAU_STUDENT_DOMAIN}`) ||
    normalized.endsWith(`@${KAU_INSTRUCTOR_DOMAIN}`)
  );
};

export const KAU_DOMAIN_ERROR =
  "Access is currently limited to KAU students and instructors only. Please use your @stu.kau.edu.sa or @kau.edu.sa email.";
