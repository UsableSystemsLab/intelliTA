import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Manage:
 *       type: object
 *       properties:
 *         edit_id:
 *           type: integer
 *           example: 55
 *         admin_id:
 *           type: integer
 *           example: 3
 *         course_id:
 *           type: integer
 *           example: 101
 *         permission_level:
 *           type: string
 *           example: 'modify_content'
 */


const Manage = sequelize.define(
  "Manage",
  {
    edit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    permission_level: {
      type: DataTypes.STRING(20),
    },
  },
  {
    tableName: "manages",
    timestamps: false,
  }
);

export default Manage;
