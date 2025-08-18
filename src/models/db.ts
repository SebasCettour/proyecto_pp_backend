import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS, // 👈 ojo: coincide con tu .env
    database: process.env.DB_NAME,
  });

  console.log("✅ Conectado a MySQL");
  return connection;
};

export default connectDb;
