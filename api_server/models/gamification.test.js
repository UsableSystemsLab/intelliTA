import "./index.js";
import Submission from "./Submission.js";
import ActivityTestCase from "./ActivityTestCase.js";
import SubmissionTestResult from "./SubmissionTestResult.js";
import UserPoints from "./UserPoints.js";
import Badge from "./Badge.js";
import UserBadge from "./UserBadge.js";
import PointsLedger, { EVENT_TYPES } from "./PointsLedger.js";
import Notification, { NOTIFICATION_TYPES } from "./Notification.js";

const attrs = (Model) => Model.rawAttributes;
const hasAttr = (Model, name) => Object.prototype.hasOwnProperty.call(attrs(Model), name);

describe("Submission (gamification columns)", () => {
    test("table name is submissions", () => {
        expect(Submission.tableName).toBe("submissions");
    });

    test("has new gamification columns", () => {
        for (const f of ["started_at", "status", "active_seconds", "hints_used", "attempt_number"]) {
            expect(hasAttr(Submission, f)).toBe(true);
        }
    });

    test("required fields are NOT NULL", () => {
        expect(attrs(Submission).started_at.allowNull).toBe(false);
        expect(attrs(Submission).status.allowNull).toBe(false);
        expect(attrs(Submission).active_seconds.allowNull).toBe(false);
        expect(attrs(Submission).hints_used.allowNull).toBe(false);
        expect(attrs(Submission).attempt_number.allowNull).toBe(false);
    });

    test("counters default to 0", () => {
        expect(attrs(Submission).active_seconds.defaultValue).toBe(0);
        expect(attrs(Submission).hints_used.defaultValue).toBe(0);
    });

    test("status validates enum values", () => {
        expect(attrs(Submission).status.validate.isIn[0]).toEqual(["PASSED", "FAILED"]);
    });

    test("associations: testResults + pointsLedger", () => {
        expect(Submission.associations.testResults).toBeDefined();
        expect(Submission.associations.pointsLedger).toBeDefined();
    });
});

describe("ActivityTestCase", () => {
    test("table name", () => {
        expect(ActivityTestCase.tableName).toBe("activity_test_cases");
    });

    test("required fields", () => {
        expect(attrs(ActivityTestCase).activity_id.allowNull).toBe(false);
        expect(attrs(ActivityTestCase).kind.allowNull).toBe(false);
        expect(attrs(ActivityTestCase).external_ref.allowNull).toBe(false);
    });

    test("kind validates enum values", () => {
        expect(attrs(ActivityTestCase).kind.validate.isIn[0]).toEqual(["CODE", "QUIZ"]);
    });

    test("declares unique composite index", () => {
        const idx = ActivityTestCase.options.indexes.find((i) => i.unique);
        expect(idx.fields).toEqual(["activity_id", "kind", "external_ref"]);
    });

    test("belongsTo Activity", () => {
        expect(ActivityTestCase.associations.activity).toBeDefined();
    });
});

describe("SubmissionTestResult", () => {
    test("table name", () => {
        expect(SubmissionTestResult.tableName).toBe("submission_test_results");
    });

    test("passed is required, points_awarded defaults to 0", () => {
        expect(attrs(SubmissionTestResult).passed.allowNull).toBe(false);
        expect(attrs(SubmissionTestResult).points_awarded.defaultValue).toBe(0);
    });

    test("unique on (submission_id, test_case_id)", () => {
        const idx = SubmissionTestResult.options.indexes.find((i) => i.unique);
        expect(idx.fields).toEqual(["submission_id", "test_case_id"]);
    });

    test("associations", () => {
        expect(SubmissionTestResult.associations.submission).toBeDefined();
        expect(SubmissionTestResult.associations.testCase).toBeDefined();
    });
});

describe("UserPoints", () => {
    test("table name and PK", () => {
        expect(UserPoints.tableName).toBe("user_points");
        expect(attrs(UserPoints).user_id.primaryKey).toBe(true);
    });

    test("counters default to 0", () => {
        expect(attrs(UserPoints).total_points.defaultValue).toBe(0);
        expect(attrs(UserPoints).current_streak_days.defaultValue).toBe(0);
        expect(attrs(UserPoints).longest_streak_days.defaultValue).toBe(0);
    });

    test("belongsTo User", () => {
        expect(UserPoints.associations.user).toBeDefined();
    });
});

describe("Badge", () => {
    test("table name", () => {
        expect(Badge.tableName).toBe("badges");
    });

    test("code is unique and required", () => {
        expect(attrs(Badge).code.unique).toBe(true);
        expect(attrs(Badge).code.allowNull).toBe(false);
    });

    test("tier and awarded_by validate enum values", () => {
        expect(attrs(Badge).tier.validate.isIn[0]).toEqual(["BRONZE", "SILVER", "GOLD"]);
        expect(attrs(Badge).awarded_by.validate.isIn[0]).toEqual(["AUTO", "INSTRUCTOR"]);
    });
});

describe("UserBadge", () => {
    test("table name", () => {
        expect(UserBadge.tableName).toBe("user_badges");
    });

    test("activity_id is nullable, user_id/badge_id required", () => {
        expect(attrs(UserBadge).user_id.allowNull).toBe(false);
        expect(attrs(UserBadge).badge_id.allowNull).toBe(false);
        expect(attrs(UserBadge).activity_id.allowNull).toBe(true);
    });

    test("unique on (user_id, badge_id, activity_id)", () => {
        const idx = UserBadge.options.indexes.find((i) => i.unique);
        expect(idx.fields).toEqual(["user_id", "badge_id", "activity_id"]);
    });

    test("associations include badge, user, activity, awardedBy", () => {
        expect(UserBadge.associations.badge).toBeDefined();
        expect(UserBadge.associations.user).toBeDefined();
        expect(UserBadge.associations.activity).toBeDefined();
        expect(UserBadge.associations.awardedBy).toBeDefined();
    });
});

describe("PointsLedger", () => {
    test("table name", () => {
        expect(PointsLedger.tableName).toBe("points_ledger");
    });

    test("exports the full event_type set", () => {
        expect(EVENT_TYPES).toEqual([
            "BASE",
            "STREAK_BONUS",
            "NO_HINT_BONUS",
            "HINT_PENALTY",
            "BUG_HUNTER_AWARD",
        ]);
    });

    test("event_type validates against EVENT_TYPES", () => {
        expect(attrs(PointsLedger).event_type.validate.isIn[0]).toEqual(EVENT_TYPES);
    });

    test("submission_id and activity_id are nullable (audit rows)", () => {
        expect(attrs(PointsLedger).submission_id.allowNull).toBe(true);
        expect(attrs(PointsLedger).activity_id.allowNull).toBe(true);
    });

    test("points is required", () => {
        expect(attrs(PointsLedger).points.allowNull).toBe(false);
    });
});

describe("Notification", () => {
    test("table name", () => {
        expect(Notification.tableName).toBe("notifications");
    });

    test("type validates against NOTIFICATION_TYPES", () => {
        expect(NOTIFICATION_TYPES).toEqual([
            "POINTS_EARNED",
            "BADGE_EARNED",
            "INSTRUCTOR_AWARD",
        ]);
        expect(attrs(Notification).type.validate.isIn[0]).toEqual(NOTIFICATION_TYPES);
    });

    test("is_read defaults to false", () => {
        expect(attrs(Notification).is_read.defaultValue).toBe(false);
    });

    test("belongsTo User", () => {
        expect(Notification.associations.user).toBeDefined();
    });
});
