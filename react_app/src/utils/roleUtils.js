export default function getRoleFromEmail(email) {
  if (email.endsWith("@stu.kau.edu.sa")) {
    return "student";
  }

 else if (email.endsWith("@kau.edu.sa")) {
    return "instructor";
  }

  else return "unknown"; 
}