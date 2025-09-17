import { Router, Request, Response } from "express";
import { pool } from "../models/db.js";

const router = Router();

// Publicar una novedad
router.post("/tablon", async (req: Request, res: Response) => {
  const { idEmpleado, descripcion } = req.body;
  if (!idEmpleado || !descripcion) {
    return res.status(400).json({ error: "Faltan datos" });
  }
  try {
    const fecha = new Date();
    const [result] = await pool.query(
      "INSERT INTO Novedad (IdEmpleado, Descripcion, Fecha) VALUES (?, ?, ?)",
      [idEmpleado, descripcion, fecha]
    );
    res.status(201).json({
      idNovedad: (result as any).insertId,
      idEmpleado,
      descripcion,
      fecha,
    });
  } catch (err) {
    res.status(500).json({ error: "Error al publicar la novedad" });
  }
});

// Obtener todas las novedades
router.get("/tablon", async (_req: Request, res: Response) => {
  try {
    const [novedades] = await pool.query(
      "SELECT * FROM Novedad ORDER BY Fecha DESC"
    );
    res.json(novedades);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener novedades" });
  }
});

export default router;