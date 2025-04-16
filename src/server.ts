import express from "express";
import mongoose from "mongoose";
import 'dotenv/config'; 
import cors from "cors";

const app = express();
app.use(cors()); // Habilita CORS

app.get("/", (req, res) => {
  res.send("✅ ¡Backend funcionando con TypeScript!");
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
