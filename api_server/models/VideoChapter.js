import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import Activity from "./Activity.js";

const VideoChapter = sequelize.define(
    "VideoChapter",
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
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        start_time_seconds: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "video_chapters",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default VideoChapter;
