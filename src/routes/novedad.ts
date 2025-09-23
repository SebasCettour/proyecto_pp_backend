import { Router, Request, Response } from "express";
import { pool } from "../models/db.js";
import multer from "multer";

const router = Router();

// Configura multer para guardar archivos en /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // asegúrate de que la carpeta exista
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Publicar una novedad
router.post(
  "/tablon",
  upload.fields([
    { name: "imagen", maxCount: 1 },
    { name: "archivo", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    const { idEmpleado, descripcion } = req.body;
    // Obtén el nombre del archivo de imagen si existe
    let imagen = null;
    if (req.files && (req.files as any).imagen && (req.files as any).imagen[0]) {
      imagen = (req.files as any).imagen[0].filename;
    }

    if (idEmpleado === undefined || descripcion === undefined) {
      return res.status(400).json({ error: "Faltan datos" });
    }
    try {
      const fecha = new Date();
      const [result]: any = await pool.query(
        "INSERT INTO Novedad (Id_Empleado, Descripcion, Fecha, Imagen) VALUES (?, ?, ?, ?)",
        [idEmpleado, descripcion, fecha, imagen]
      );
      res.status(201).json({
        idNovedad: result.insertId,
        idEmpleado,
        descripcion,
        fecha,
        imagen,
      });
    } catch (err) {
      console.error("Error al publicar la novedad:", err);
      res.status(500).json({ error: "Error al publicar la novedad" });
    }
  }
);

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
