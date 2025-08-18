import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log("✅ Conectado a la base de datos");
  return connection;
};

export default connectDb;
