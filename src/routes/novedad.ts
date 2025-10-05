import { Router, Request, Response } from "express";
import { pool } from "../models/db.js";
import multer from "multer";
import fs from "fs";

const router = Router();

// Crear carpetas si no existen
const createUploadDirs = () => {
  const dirs = ["uploads/tablon_imgs", "uploads/tablon_files"];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determinar carpeta según el tipo de archivo
    if (file.mimetype.startsWith("image/")) {
      cb(null, "uploads/tablon_imgs/");
    } else {
      cb(null, "uploads/tablon_files/");
    }
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
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

    let imagen = null;
    if (
      req.files &&
      (req.files as any).imagen &&
      (req.files as any).imagen[0]
    ) {
      imagen = (req.files as any).imagen[0].filename;
    }

    let archivoAdjunto = null;
    if (
      req.files &&
      (req.files as any).archivo &&
      (req.files as any).archivo[0]
    ) {
      archivoAdjunto = (req.files as any).archivo[0].filename;
    }

    if (idEmpleado === undefined || descripcion === undefined) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    try {
      const fecha = new Date();
      const [result]: any = await pool.query(
        "INSERT INTO Novedad (Id_Empleado, Descripcion, Fecha, Imagen, ArchivoAdjunto) VALUES (?, ?, ?, ?, ?)",
        [idEmpleado, descripcion, fecha, imagen, archivoAdjunto]
      );
      res.status(201).json({
        idNovedad: result.insertId,
        idEmpleado,
        descripcion,
        fecha,
        imagen,
        archivoAdjunto,
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
      "SELECT Id_Novedad, Id_Empleado, Descripcion, Fecha, Imagen, ArchivoAdjunto FROM Novedad ORDER BY Fecha DESC"
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

// Actualizar una novedad por id
router.put("/tablon/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { descripcion } = req.body;

  try {
    await pool.query(
      "UPDATE Novedad SET Descripcion = ? WHERE Id_Novedad = ?",
      [descripcion, id]
    );
    res.status(200).json({ message: "Novedad actualizada correctamente" });
  } catch (err) {
    console.error("Error al actualizar novedad:", err);
    res.status(500).json({ error: "Error al actualizar la novedad" });
  }
});

export default router;
