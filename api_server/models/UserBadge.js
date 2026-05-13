import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import User from "./User.js";
import Badge from "./Badge.js";
import Activity from "./Activity.js";

const UserBadge = sequelize.define(
    "UserBadge",
    {
        user_badge_id: {
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
        badge_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Badge,
                key: "badge_id",
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
        awarded_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        awarded_by_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: User,
                key: "user_id",
            },
        },
    },
    {
        tableName: "user_badges",
        timestamps: false,
        indexes: [
            { unique: true, fields: ["user_id", "badge_id", "activity_id"] },
        ],
    }
);

export default UserBadge;
