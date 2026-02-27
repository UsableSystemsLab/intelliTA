import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import User from "./User.js";
import Activity from "./Activity.js";

const VideoProgress = sequelize.define(
    "VideoProgress",
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
        activity_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Activity,
                key: "activity_id",
            },
        },
        last_watched_seconds: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "video_progress",
        timestamps: true,
        createdAt: false,
        updatedAt: "updated_at",
        indexes: [
            {
                unique: true,
                fields: ["user_id", "activity_id"],
            },
        ],
    }
);

export default VideoProgress;
