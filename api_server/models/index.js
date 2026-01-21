import User from "./User.js";
import Course from "./Course.js";
import Enrollment from "./Enrollment.js";
import Lab from "./Lab.js";
import Activity from "./Activity.js";

// USER -> COURSE (Creator/Instructor)
User.hasMany(Course, { foreignKey: "instructor_id", as: "taughtCourses" });
Course.belongsTo(User, { foreignKey: "instructor_id", as: "instructor" });

// USER <-> COURSE (Participant/Student via Enrollment)
User.belongsToMany(Course, {
  through: Enrollment,
  foreignKey: "user_id",
  as: "enrolledCourses",
});

Course.belongsToMany(User, {
  through: Enrollment,
  foreignKey: "course_id",
  as: "students",
});

Course.hasMany(Lab, {
  foreignKey: "course_id",
  as: "labs",
});

Lab.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

// COURSE -> ACTIVITY
Course.hasMany(Activity, {
  foreignKey: "course_id",
  as: "activities",
});

Activity.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

export {
  User,
  Course,
  Enrollment,
  Lab,
  Activity,
};
