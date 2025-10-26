import dotenv from "dotenv";
dotenv.config();

console.log("🔧 Environment loaded:");
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "LOADED" : "MISSING");
console.log("- JWT_SECRET value:", process.env.JWT_SECRET);
console.log("- DB_HOST:", process.env.DB_HOST);
console.log("- PORT:", process.env.PORT);

import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { pool } from "./models/db.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import cie10Routes from "./routes/cie10.js";
import novedadRouter from "./routes/novedad.js";
import usuarioRouter from "./routes/usuario.js";
import licenciasRoutes from "./routes/licencias.js";
import familiaresRoutes from "./routes/familiares.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Configurar CORS para permitir solicitudes desde el frontend
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Rutas de autenticación y administración
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/cie10", cie10Routes);
app.use("/api/novedad", novedadRouter);
app.use("/api/usuario", usuarioRouter);
app.use("/api/licencias", licenciasRoutes);
app.use("/api/familiares", familiaresRoutes);

// Ruta raíz para probar la conexión a la base de datos
app.get("/", async (_req: any, res: any) => {
  try {
    const [rows] = await pool.query("SELECT 'Hola desde MySQL!' as msg");
    res.json(rows);
  } catch (err) {
    console.error("Error en la consulta a la base de datos:", err);
    res.status(500).json({ error: "Error de conexión a la DB" });
  }
});

// Verificar la conexión a la base de datos antes de iniciar el servidor
pool
  .getConnection()
  .then((connection) => {
    console.log("Conexión a la base de datos establecida");
    connection.release();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error al conectar a la base de datos:", err);
    process.exit(1);
  });