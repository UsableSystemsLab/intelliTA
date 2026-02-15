import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

const UserApiKey = sequelize.define(
  "UserApiKey",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    base_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    api_key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    model_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "user_api_keys",
    schema: "public",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["user_id", "base_url"],
      },
    ],
  },
);

export default UserApiKey;
