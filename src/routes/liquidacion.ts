import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../models/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Crear carpeta si no existe
const createUploadDir = () => {
  if (!fs.existsSync("uploads/liquidaciones")) {
    fs.mkdirSync("uploads/liquidaciones", { recursive: true });
  }
};

createUploadDir();

// Configuración de multer para subir archivos PDF de liquidaciones
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/liquidaciones/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `liquidacion_${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Subir liquidación de sueldo
router.post(
  "/subir",
  authenticateToken,
  upload.single("liquidacionPdf"),
  async (req: Request, res: Response) => {
    try {
      const { empleadoId, fechaLiquidacion, total } = req.body;
      
      console.log("📝 Datos recibidos para liquidación:", req.body);

      if (!empleadoId || !fechaLiquidacion || !total) {
        return res.status(400).json({ 
          message: "Faltan campos obligatorios: empleadoId, fechaLiquidacion, total" 
        });
      }

      // ✅ INSERT CORREGIDO CON LOS CAMPOS REALES
      const [result] = await pool.execute(
        `INSERT INTO Liquidacion (
          Id_Empleado, FechaLiquidacion, Total
        ) VALUES (?, ?, ?)`,
        [empleadoId, fechaLiquidacion, total]
      );

      res.status(201).json({
        message: "Liquidación creada exitosamente",
        liquidacionId: (result as any).insertId,
      });
    } catch (error) {
      console.error("Error creando liquidación:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
);

// Obtener todas las liquidaciones (para contadores)
router.get(
  "/todas",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // ✅ CONSULTA CORREGIDA CON LOS CAMPOS REALES
      const [liquidaciones] = await pool.execute(
        `SELECT 
          l.Id_Liquidacion,
          l.Id_Empleado,
          l.FechaLiquidacion,
          l.Total,
          e.Nombre, 
          e.Apellido, 
          e.Numero_Documento
         FROM Liquidacion l
         JOIN Empleado e ON l.Id_Empleado = e.Id_Empleado
         ORDER BY l.FechaLiquidacion DESC`
      );

      res.json(liquidaciones);
    } catch (error) {
      console.error("Error obteniendo liquidaciones:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
);

// Obtener liquidaciones por empleado (DNI)
router.get(
  "/empleado/:dni",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { dni } = req.params;

      // ✅ CONSULTA CORREGIDA CON LOS CAMPOS REALES
      const [liquidaciones] = await pool.execute(
        `SELECT 
          l.Id_Liquidacion,
          l.Id_Empleado,
          l.FechaLiquidacion,
          l.Total,
          e.Nombre, 
          e.Apellido
         FROM Liquidacion l
         JOIN Empleado e ON l.Id_Empleado = e.Id_Empleado
         WHERE e.Numero_Documento = ?
         ORDER BY l.FechaLiquidacion DESC`,
        [dni]
      );

      res.json(liquidaciones);
    } catch (error) {
      console.error("Error obteniendo liquidaciones:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
);

export default router;