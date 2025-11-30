import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         admin_id:
 *           type: integer
 *           example: 3
 *         user_id:
 *           type: integer
 *           example: 1
 *         access_level:
 *           type: string
 *           example: 'super_admin'
 */


const Admin = sequelize.define(
  "Admin",
  {
    admin_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    access_level: {
      type: DataTypes.STRING(20),
    },
  },
  {
    tableName: "admins",
    timestamps: false,
  }
);

export default Admin;
