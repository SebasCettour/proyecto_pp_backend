import express from "express";
import { pool } from "./models/db.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Rutas de autenticación
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

app.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 'Hola desde MySQL!' as msg");
    res.json(rows);
  } catch (err) {
    console.error("Error en la consulta a la base de datos:", err);
    res.status(500).json({ error: "Error de conexión a la DB" });
  }
});

// Verificar la conexión a la base de datos al iniciar
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Conexión a la base de datos establecida");
    connection.release(); // Liberar la conexión al pool
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error al conectar a la base de datos:", err);
    process.exit(1); // Terminar el proceso si no se puede conectar
  });