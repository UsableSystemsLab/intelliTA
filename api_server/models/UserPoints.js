import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import User from "./User.js";

const UserPoints = sequelize.define(
    "UserPoints",
    {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: User,
                key: "user_id",
            },
        },
        total_points: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        current_streak_days: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        longest_streak_days: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        last_streak_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        last_activity_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "user_points",
        timestamps: true,
        createdAt: false,
        updatedAt: "updated_at",
    }
);

export default UserPoints;
