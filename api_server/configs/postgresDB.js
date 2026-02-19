import { Sequelize } from "sequelize";
import logger from "./logger.js";

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST,
    dialect: "postgres",
  },
);

const postgresDB = async () => {
  try {
    await sequelize.authenticate();
    // Enable pgcrypto extension for API key encryption
    await sequelize.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    // Alter the tables to match the models
    await sequelize.sync({ alter: true });
    logger.info("Postgres db connection has been established successfully.");
  } catch (error) {
    logger.error("Unable to connect to postgres", error);
  }
};

export { sequelize, postgresDB };
