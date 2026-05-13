import User from "./User.js";
import Course from "./Course.js";
import Enrollment from "./Enrollment.js";
import Lab from "./Lab.js";
import Activity from "./Activity.js";
import UserApiKey from "./UserApiKey.js";
import VideoTranscript from "./VideoTranscript.js";
import GitHubConnection from "./GitHubConnection.js";

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

// COURSE -> GITHUB CONNECTION
Course.hasOne(GitHubConnection, { foreignKey: "course_id", as: "githubConnection", onDelete: "CASCADE" });
GitHubConnection.belongsTo(Course, { foreignKey: "course_id", as: "course" });

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

// GAMIFICATION
import ActivityTestCase from "./ActivityTestCase.js";
import SubmissionTestResult from "./SubmissionTestResult.js";
import UserPoints from "./UserPoints.js";
import Badge from "./Badge.js";
import UserBadge from "./UserBadge.js";
import PointsLedger from "./PointsLedger.js";
import Notification from "./Notification.js";

// ACTIVITY -> TEST CASES
Activity.hasMany(ActivityTestCase, { foreignKey: "activity_id", as: "testCases", onDelete: "CASCADE" });
ActivityTestCase.belongsTo(Activity, { foreignKey: "activity_id", as: "activity" });

// SUBMISSION <-> TEST RESULTS
Submission.hasMany(SubmissionTestResult, { foreignKey: "submission_id", as: "testResults", onDelete: "CASCADE" });
SubmissionTestResult.belongsTo(Submission, { foreignKey: "submission_id", as: "submission" });
ActivityTestCase.hasMany(SubmissionTestResult, { foreignKey: "test_case_id", as: "results", onDelete: "CASCADE" });
SubmissionTestResult.belongsTo(ActivityTestCase, { foreignKey: "test_case_id", as: "testCase" });

// USER -> POINTS
User.hasOne(UserPoints, { foreignKey: "user_id", as: "points", onDelete: "CASCADE" });
UserPoints.belongsTo(User, { foreignKey: "user_id", as: "user" });

// USER <-> BADGES (through UserBadge)
User.belongsToMany(Badge, { through: UserBadge, foreignKey: "user_id", otherKey: "badge_id", as: "badges" });
Badge.belongsToMany(User, { through: UserBadge, foreignKey: "badge_id", otherKey: "user_id", as: "users" });
User.hasMany(UserBadge, { foreignKey: "user_id", as: "userBadges" });
UserBadge.belongsTo(User, { foreignKey: "user_id", as: "user" });
Badge.hasMany(UserBadge, { foreignKey: "badge_id", as: "userBadges" });
UserBadge.belongsTo(Badge, { foreignKey: "badge_id", as: "badge" });
Activity.hasMany(UserBadge, { foreignKey: "activity_id", as: "userBadges" });
UserBadge.belongsTo(Activity, { foreignKey: "activity_id", as: "activity" });
UserBadge.belongsTo(User, { foreignKey: "awarded_by_user_id", as: "awardedBy" });

// POINTS LEDGER
User.hasMany(PointsLedger, { foreignKey: "user_id", as: "pointsLedger" });
PointsLedger.belongsTo(User, { foreignKey: "user_id", as: "user" });
Submission.hasMany(PointsLedger, { foreignKey: "submission_id", as: "pointsLedger" });
PointsLedger.belongsTo(Submission, { foreignKey: "submission_id", as: "submission" });
Activity.hasMany(PointsLedger, { foreignKey: "activity_id", as: "pointsLedger" });
PointsLedger.belongsTo(Activity, { foreignKey: "activity_id", as: "activity" });

// NOTIFICATIONS
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

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
  GitHubConnection,
  ActivityTestCase,
  SubmissionTestResult,
  UserPoints,
  Badge,
  UserBadge,
  PointsLedger,
  Notification,
};
