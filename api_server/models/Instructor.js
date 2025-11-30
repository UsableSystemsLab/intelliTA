import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Instructor:
 *       type: object
 *       properties:
 *         instructor_id:
 *           type: integer
 *           example: 5
 *         user_id:
 *           type: integer
 *           example: 2
 *         department:
 *           type: string
 *           example: 'IT'
 */


const Instructor = sequelize.define(
  "Instructor",
  {
    instructor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(50),
    },
  },
  {
    tableName: "instructors",
    timestamps: false,
  }
);

export default Instructor;
