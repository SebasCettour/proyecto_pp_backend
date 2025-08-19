import express from "express";
import connectDb from "./models/db.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.get("/", async (_req, res) => {
  try {
    const connection = await connectDb();
    const [rows] = await connection.query("SELECT 'Hola desde MySQL!' as msg");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error de conexión a la DB" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
