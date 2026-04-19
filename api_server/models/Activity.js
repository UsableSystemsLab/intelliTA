import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";
import Course from "./Course.js";

const Activity = sequelize.define(
  "Activity",
  {
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Course,
        key: 'course_id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    md_file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    starter_code_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    quiz_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    github_classroom_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    github_repo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    github_assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "activities",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default Activity;
