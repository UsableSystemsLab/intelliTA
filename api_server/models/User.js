import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         firebaseId:
 *            type: string
 *            example: 'LkIlohuoMVXJDxED0wm9SFrPhpO2'
 *         first_name:
 *           type: string
 *           example: 'khalid '
 *         last_name:
 *           type: string
 *           example: 'Alharbi'
 *         email:
 *           type: string
 *           example: 'kalharbi@example.com'
 */

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      field: "user_id",
      primaryKey: true,
      autoIncrement: true,
    },
    firebaseId: {
      type: DataTypes.STRING(128),
      field: "firebase_uid",
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.STRING(15),
      field: "fname",
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(15),
      field: "lname",
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(50),
      field: "email",
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      field: "bio",
      allowNull: true,
    },
    photo_url: {
      type: DataTypes.TEXT,
      field: "photo_url",
      allowNull: true,
    },
    github_username: {
      type: DataTypes.STRING(39),
      field: "github_username",
      allowNull: true,
      unique: true,
    },
    github_verified: {
      type: DataTypes.BOOLEAN,
      field: "github_verified",
      allowNull: false,
      defaultValue: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      field: "deleted_at",
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "users",
    schema: "public",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default User;
