import express, { Request, Response } from "express";
import cors from "cors";
import { pool } from "./models/db.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import cie10Routes from "./routes/cie11.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Configurar CORS para permitir solicitudes desde el frontend
app.use(
  cors({
    origin: "http://localhost:3000", // Origen del frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Encabezados permitidos
  })
);

app.use(express.json());

// Rutas de autenticación y administración
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/cie10", cie10Routes);

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
    console.log("✅ Conexión a la base de datos establecida");
    connection.release(); // Liberar la conexión al pool
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error al conectar a la base de datos:", err);
    process.exit(1); // Terminar el proceso si no se puede conectar
  });
