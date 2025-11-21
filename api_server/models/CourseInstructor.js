import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

// Define a junction table for course instructor relationship

const CourseInstructor = sequelize.define(
  "course_instructors",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    instructor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  },
  {
    tableName: "course_instructors",
    timestamps: false   
  }
);

export default CourseInstructor;
