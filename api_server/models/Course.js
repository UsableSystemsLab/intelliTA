import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js"; 
/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         course_id:
 *           type: integer
 *         title:
 *           type: string
 *         course_code:
 *           type: string
 *         description:
 *           type: string
 *         instructor_ids:
 *           type: array
 *           items:
 *             type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 */

const Course = sequelize.define(
  "Course",
  {
    course_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    course_code: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "courses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default Course;