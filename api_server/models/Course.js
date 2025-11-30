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
 *           example: 3
 *         title:
 *           type: string
 *           example: 'Introduction to Programming'
 *         course_code:
 *           type: string
 *           example: 'CPCS202'
 *         description:
 *           type: string
 *           example: 'Fundamentals of programming using Java.'
 *         instructor_id:
 *           type: integer
 *           example: 5
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: '2025-01-20T12:00:00Z'
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
    instructor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
