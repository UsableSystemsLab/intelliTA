import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       properties:
 *         enrollment_id:
 *           type: integer
 *           example: 200
 *         student_id:
 *           type: integer
 *           example: 10
 *         course_id:
 *           type: integer
 *           example: 14
 *         enrollment_date:
 *           type: string
 *           format: date
 *           example: '2025-02-15'
 *         grade:
 *           type: string
 *           example: 'A'
 *         status:
 *           type: string
 *           enum: [active, completed, dropped]
 *           example: 'active'
 */


const Enrollment = sequelize.define(
  "Enrollment",
  {
    enrollment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    enrollment_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    grade: {
      type: DataTypes.STRING(2),
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enrolled_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "active",
      validate: {
        isIn: [["active", "completed", "dropped"]],
      },
    },
  },
  {
    tableName: "enrollments",
    timestamps: false,
  }
);

export default Enrollment;
