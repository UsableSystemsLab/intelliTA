export default function getRoleFromEmail(email) {
  if (email.endsWith("@stu.kau.edu.sa")) {
    return "student";
  }

 else if (email.endsWith("@kau.edu.sa")) {
    return "instructor";
  }
  // this has been chnaged to instructor because I wanted to test with instructor account 
  // later we should ask doctor about what this should be
  else return "instructor"; 
}