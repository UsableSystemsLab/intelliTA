import User from "./User.js";
import Course from "./Course.js";
import Enrollment from "./Enrollment.js";
import Lab from "./Lab.js";
import Activity from "./Activity.js";
import UserApiKey from "./UserApiKey.js";
import VideoTranscript from "./VideoTranscript.js";

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

// ENROLLMENT -> USER
Enrollment.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Enrollment, { foreignKey: "user_id", as: "enrollments" });

// ENROLLMENT -> COURSE
Enrollment.belongsTo(Course, { foreignKey: "course_id", as: "course" });
Course.hasMany(Enrollment, { foreignKey: "course_id", as: "enrollments" });

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

// ACTIVITY SUBMISSIONS
import Submission from "./Submission.js";

User.hasMany(Submission, { foreignKey: "user_id", as: "submissions" });
Submission.belongsTo(User, { foreignKey: "user_id", as: "student" });

Activity.hasMany(Submission, { foreignKey: "activity_id", as: "submissions" });
Submission.belongsTo(Activity, { foreignKey: "activity_id", as: "activity" });

// USER -> API KEYS
User.hasMany(UserApiKey, { foreignKey: "user_id", as: "apiKeys" });
UserApiKey.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ACTIVITY -> VIDEO TRANSCRIPT
Activity.hasOne(VideoTranscript, { foreignKey: "activity_id", as: "transcript" });
VideoTranscript.belongsTo(Activity, { foreignKey: "activity_id", as: "activity" });
// QUIZ QUESTIONS
import QuizQuestion from "./QuizQuestion.js";
import VideoProgress from "./VideoProgress.js";
import StudentAnswer from "./StudentAnswer.js";
import VideoChapter from "./VideoChapter.js";

Activity.hasMany(QuizQuestion, { foreignKey: "activity_id", as: "quizQuestions", onDelete: "CASCADE" });
QuizQuestion.belongsTo(Activity, { foreignKey: "activity_id", as: "activity" });

User.hasMany(VideoProgress, { foreignKey: "user_id", as: "videoProgress" });
VideoProgress.belongsTo(User, { foreignKey: "user_id", as: "student" });
Activity.hasMany(VideoProgress, { foreignKey: "activity_id", as: "videoProgress" });
VideoProgress.belongsTo(Activity, { foreignKey: "activity_id", as: "activity" });

User.hasMany(StudentAnswer, { foreignKey: "user_id", as: "answers" });
StudentAnswer.belongsTo(User, { foreignKey: "user_id", as: "student" });
QuizQuestion.hasMany(StudentAnswer, { foreignKey: "question_id", as: "answers" });
StudentAnswer.belongsTo(QuizQuestion, { foreignKey: "question_id", as: "question" });
Activity.hasMany(StudentAnswer, { foreignKey: "activity_id", as: "studentAnswers" });
StudentAnswer.belongsTo(Activity, { foreignKey: "activity_id", as: "activity" });

// VIDEO CHAPTERS
Activity.hasMany(VideoChapter, { foreignKey: "activity_id", as: "chapters", onDelete: "CASCADE" });
VideoChapter.belongsTo(Activity, { foreignKey: "activity_id", as: "activity" });

export {
  User,
  Course,
  Enrollment,
  Lab,
  Activity,
  Submission,
  UserApiKey,
  VideoTranscript,
  QuizQuestion,
  VideoProgress,
  StudentAnswer,
  VideoChapter,
};
