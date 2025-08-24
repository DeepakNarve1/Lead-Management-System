import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Prefer DATABASE_URL if provided (e.g., Render), else use discrete variables
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: process.env.DB_DIALECT || "postgres",
    dialectOptions: {
      ssl: process.env.DB_SSL === "true" || process.env.NODE_ENV === "production" ? {
        require: true,
        rejectUnauthorized: false,
      } : undefined,
    },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT || "postgres",
    }
  );
}

export default sequelize;
