import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import User from "./User.js";
import Activity from "./Activity.js";

const Submission = sequelize.define(
    "Submission",
    {
        submission_id: {
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
        activity_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Activity,
                key: "activity_id",
            },
        },
        score: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        started_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(8),
            allowNull: false,
            validate: { isIn: [["PASSED", "FAILED"]] },
        },
        active_seconds: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        hints_used: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        attempt_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "submissions",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default Submission;
