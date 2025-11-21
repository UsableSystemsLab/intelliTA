import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Lab:
 *       type: object
 *       properties:
 *         lab_id:
 *           type: integer
 *           example: 1
 *         course_id:
 *           type: integer
 *           example: 3
 *         title:
 *           type: string
 *           example: "Lab 1 - Singleton"
 *         type:
 *           type: string
 *           enum: [video, markdown]
 *           example: "video"
 *         video_url:
 *           type: string
 *           nullable: true
 *           example: "https://www.youtube.com/watch?v=M88sDrY66r8"
 *         markdown_text:
 *           type: string
 *           nullable: true
 *           example: |
 *             ## Lab Instructions
 *             Follow the steps to complete the lab.
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-01-20T12:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2025-01-21T12:00:00Z"
 */

const Lab = sequelize.define(
  "Lab",
  {
    lab_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "courses",
        key: "course_id",
      },
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("video", "markdown"),
      allowNull: false,
    },
    video_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    markdown_text: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
  },
  {
    tableName: "labs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Lab.associate = (models) => {
  Lab.belongsTo(models.Course, {
    foreignKey: "course_id",
    as: "course",
  });
};

export default Lab;
