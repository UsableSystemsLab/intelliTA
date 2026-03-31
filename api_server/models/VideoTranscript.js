import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

const VideoTranscript = sequelize.define(
  "VideoTranscript",
  {
    transcript_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    activity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "activities",
        key: "activity_id",
      },
    },
    video_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    transcript_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transcript_url_ar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "processing", "completed", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    word_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "video_transcripts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default VideoTranscript;
