import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import User from "./User.js";
import Submission from "./Submission.js";
import Activity from "./Activity.js";

const EVENT_TYPES = [
    "BASE",
    "STREAK_BONUS",
    "NO_HINT_BONUS",
    "HINT_PENALTY",
    "BUG_HUNTER_AWARD",
];

const PointsLedger = sequelize.define(
    "PointsLedger",
    {
        ledger_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "user_id",
            },
        },
        submission_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: Submission,
                key: "submission_id",
            },
        },
        activity_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: Activity,
                key: "activity_id",
            },
        },
        event_type: {
            type: DataTypes.STRING(24),
            allowNull: false,
            validate: { isIn: [EVENT_TYPES] },
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    },
    {
        tableName: "points_ledger",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);

export { EVENT_TYPES };
export default PointsLedger;
