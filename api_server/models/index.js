import User from "./User.js";
import Student from "./Student.js";
import Instructor from "./Instructor.js";
import Admin from "./Admin.js";
import Course from "./Course.js";
import Enrollment from "./Enrollment.js";
import Manage from "./Manage.js";
import Lab from "./Lab.js";  
import CourseInstructor from "./CourseInstructor.js";

// USER -> STUDENT / INSTRUCTOR / ADMIN
User.hasOne(Student, { foreignKey: "user_id" });
Student.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(Instructor, { foreignKey: "user_id" });
Instructor.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(Admin, { foreignKey: "user_id" });
Admin.belongsTo(User, { foreignKey: "user_id" });

// updated relations so now it becomes many to many
Course.belongsToMany(Instructor, {
  through: CourseInstructor,
  foreignKey: "course_id",
  as: "instructors",
});

Instructor.belongsToMany(Course, {
  through: CourseInstructor,
  foreignKey: "instructor_id",
  as: "courses",
});


// STUDENT <-> COURSE (ENROLLMENT)
Student.belongsToMany(Course, {
  through: Enrollment,
  foreignKey: "student_id",
});

Course.belongsToMany(Student, {
  through: Enrollment,
  foreignKey: "course_id",
});

// ADMIN <-> COURSE (MANAGE)
Admin.belongsToMany(Course, {
  through: Manage,
  foreignKey: "admin_id",
});

Course.belongsToMany(Admin, {
  through: Manage,
  foreignKey: "course_id",
});


Course.hasMany(Lab, {
  foreignKey: "course_id",
  as: "labs",
});

Lab.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});


export {
  User,
  Student,
  Instructor,
  Admin,
  Course,
  Enrollment,
  Manage,
  Lab,
};
