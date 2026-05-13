import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import Submission from "./Submission.js";
import ActivityTestCase from "./ActivityTestCase.js";

const SubmissionTestResult = sequelize.define(
    "SubmissionTestResult",
    {
        result_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        submission_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Submission,
                key: "submission_id",
            },
        },
        test_case_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: ActivityTestCase,
                key: "test_case_id",
            },
        },
        passed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        points_awarded: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "submission_test_results",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [
            { unique: true, fields: ["submission_id", "test_case_id"] },
        ],
    }
);

export default SubmissionTestResult;
