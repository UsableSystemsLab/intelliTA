import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import User from "./User.js";

const NOTIFICATION_TYPES = ["POINTS_EARNED", "BADGE_EARNED", "INSTRUCTOR_AWARD"];

const Notification = sequelize.define(
    "Notification",
    {
        notification_id: {
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
        type: {
            type: DataTypes.STRING(24),
            allowNull: false,
            validate: { isIn: [NOTIFICATION_TYPES] },
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        read_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "notifications",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [
            { fields: ["user_id", "is_read", "created_at"] },
        ],
    }
);

export { NOTIFICATION_TYPES };
export default Notification;
