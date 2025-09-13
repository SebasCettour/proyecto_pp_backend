import express, { Router } from "express";

const router = Router();

// Ruta de prueba
router.get("/dashboard", (req: any, res: any) => {
  res.json({ msg: "Dashboard funcionando" });
});

export default router;
