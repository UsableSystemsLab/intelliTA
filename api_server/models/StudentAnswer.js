import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import User from "./User.js";
import Activity from "./Activity.js";
import QuizQuestion from "./QuizQuestion.js";

const StudentAnswer = sequelize.define(
    "StudentAnswer",
    {
        id: {
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
        question_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: QuizQuestion,
                key: "id",
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
        // raw submitted answer
        answer: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
        is_correct: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        answered_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "student_answers",
        timestamps: false,
    }
);

export default StudentAnswer;
