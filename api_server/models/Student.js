import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         student_id:
 *           type: integer
 *           example: 10
 *         user_id:
 *           type: integer
 *           example: 1
 *         enrollment_date:
 *           type: string
 *           format: date
 *           example: '2025-02-01'
 *         level:
 *           type: string
 *           example: 'Freshman'
 *         points:
 *           type: integer
 *           example: 120
 */


const Student = sequelize.define(
  "Student",
  {
    student_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    enrollment_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    level: {
      type: DataTypes.STRING(50),
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "students",
    timestamps: false,
  }
);

export default Student;
