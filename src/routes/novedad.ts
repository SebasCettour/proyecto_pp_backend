import { Router, Request, Response } from "express";
import { pool } from "../models/db.js";

const router = Router();

// Publicar una novedad
router.post("/tablon", async (req: Request, res: Response) => {
  const { idEmpleado, descripcion } = req.body;
  if (idEmpleado === undefined || descripcion === undefined) {
    return res.status(400).json({ error: "Faltan datos" });
  }
  try {
    const fecha = new Date();
    const [result]: any = await pool.query(
      "INSERT INTO Novedad (Id_Empleado, Descripcion, Fecha) VALUES (?, ?, ?)",
      [idEmpleado, descripcion, fecha]
    );
    res.status(201).json({
      idNovedad: (result as any).insertId,
      idEmpleado,
      descripcion,
      fecha,
    });
  } catch (err) {
    console.error("Error al publicar la novedad:", err);
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

// Eliminar una novedad por id
router.delete("/tablon/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM Novedad WHERE Id_Novedad = ?", [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar la novedad" });
  }
});

export default router;