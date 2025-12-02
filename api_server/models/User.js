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
