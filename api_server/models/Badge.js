import { DataTypes } from "sequelize";
import { sequelize } from "../configs/postgresDB.js";

const Badge = sequelize.define(
    "Badge",
    {
        badge_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        code: {
            type: DataTypes.STRING(32),
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(64),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        icon_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tier: {
            type: DataTypes.STRING(8),
            allowNull: false,
            validate: { isIn: [["BRONZE", "SILVER", "GOLD"]] },
        },
        awarded_by: {
            type: DataTypes.STRING(12),
            allowNull: false,
            validate: { isIn: [["AUTO", "INSTRUCTOR"]] },
        },
    },
    {
        tableName: "badges",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);

export default Badge;
