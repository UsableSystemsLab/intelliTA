import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: '123e4567-e89b-12d3-a456-426614174000'
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
    first_name: {
      type: DataTypes.STRING(15),
      field: "fName",
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(15),
      field: "lName",
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
