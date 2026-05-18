import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import Activity from "./Activity.js";

const QuizQuestion = sequelize.define(
    "QuizQuestion",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        activity_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Activity,
                key: "activity_id",
            },
        },
        time_seconds: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // mcq | true_false | fill_blank | coding
        type: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        // mcq / true_false / fill_blank
        question: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // coding only
        title: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        instruction: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        check_regex: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // coding only — name of the test method this checkpoint runs against
        test_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        // coding only, Java only — class containing the test method
        test_class: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        // mcq only — array of option strings
        options: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        // int (mcq index) | bool (true_false) | string (fill_blank) — null for coding
        correct_answer: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    },
    {
        tableName: "quiz_questions",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);

export default QuizQuestion;
