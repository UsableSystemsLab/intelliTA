import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import Activity from "./Activity.js";

const ActivityTestCase = sequelize.define(
    "ActivityTestCase",
    {
        test_case_id: {
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
        kind: {
            type: DataTypes.STRING(4),
            allowNull: false,
            validate: { isIn: [["CODE", "QUIZ"]] },
        },
        external_ref: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        position: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "activity_test_cases",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [
            { unique: true, fields: ["activity_id", "kind", "external_ref"] },
        ],
    }
);

export default ActivityTestCase;
