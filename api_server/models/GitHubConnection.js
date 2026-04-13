import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

const GitHubConnection = sequelize.define(
  "GitHubConnection",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "courses",
        key: "course_id",
      },
    },
    github_client_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    github_client_secret: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    github_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    github_username: {
      type: DataTypes.STRING(39),
      allowNull: true,
    },
    github_org: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    github_classroom_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    github_classroom_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "github_connections",
    schema: "public",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default GitHubConnection;
