import express from "express";

const router = express.Router();

console.log("🧪 TEST-SIMPLE.TS CARGADO EXITOSAMENTE");

router.get("/test-simple", (req, res) => {
  console.log("✅ Ruta test-simple funcionando");
  res.json({ message: "Ruta de prueba simple funciona" });
});

export default router;