import { Sequelize } from "sequelize";
import logger from "./logger.js";

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST,
    dialect: "postgres",
    logging: (msg) => logger.debug(msg),
  },
);

const postgresDB = async () => {
  try {
    await sequelize.authenticate();
    // Alter the tables to match the models
    await sequelize.sync({ alter: true });
    logger.info("Postgres db connection has been established successfully.");
  } catch (error) {
    logger.error("Unable to connect to postgres", error);
  }
};

export { sequelize, postgresDB };
