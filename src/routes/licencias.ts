import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../models/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Crear carpeta si no existe
const createUploadDir = () => {
  if (!fs.existsSync('uploads/certificados')) {
    fs.mkdirSync('uploads/certificados', { recursive: true });
  }
};

createUploadDir();

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/certificados/");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Crear solicitud de licencia
router.post(
  "/solicitar",
  authenticateToken,
  upload.single("certificadoMedico"),
  async (req: Request, res: Response) => {
    try {
      const {
        nombre,
        apellido,
        documento,
        area,
        motivo,
        observaciones,
        diagnosticoCIE10_codigo,
        diagnosticoCIE10_descripcion,
      } = req.body;

      const certificadoMedico = req.file ? req.file.filename : null;

      // Validaciones básicas
      if (!nombre || !apellido || !documento || !area || !motivo) {
        return res
          .status(400)
          .json({ message: "Faltan campos obligatorios" });
      }

      // Validación específica para enfermedad
      if (motivo === "Enfermedad" && (!certificadoMedico || !diagnosticoCIE10_codigo)) {
        return res.status(400).json({
          message:
            "Para licencias por enfermedad se requiere certificado médico y diagnóstico CIE-10",
        });
      }

      // Casting del user para acceder a id
      const user = req.user as { id: number; username: string; role: string } | undefined;

      // Insertar en la base de datos (asegurando que Estado sea 'Pendiente')
      const [result] = await pool.execute(
        `INSERT INTO Licencia (
          Nombre, Apellido, Documento, Area, Motivo, 
          Observaciones, CertificadoMedico,
          DiagnosticoCIE10_Codigo, DiagnosticoCIE10_Descripcion, Estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nombre,
          apellido,
          documento,
          area,
          motivo,
          observaciones || null,
          certificadoMedico,
          diagnosticoCIE10_codigo || null,
          diagnosticoCIE10_descripcion || null,
          'Pendiente'
        ]
      );

      res.status(201).json({
        message: "Solicitud de licencia creada exitosamente",
        licenciaId: (result as any).insertId,
      });
    } catch (error) {
      console.error("Error creando solicitud de licencia:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
);

// Obtener licencias pendientes
router.get("/pendientes", authenticateToken, async (req: Request, res: Response) => {
  try {
    const [licencias] = await pool.execute(
      "SELECT * FROM Licencia WHERE Estado = 'Pendiente' ORDER BY FechaSolicitud DESC"
    );
    res.json(licencias);
  } catch (error) {
    console.error("Error obteniendo licencias:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Responder solicitud
router.put("/responder/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado, motivoRechazo } = req.body;

    await pool.execute(
      "UPDATE Licencia SET Estado = ?, FechaRespuesta = NOW(), MotivoRechazo = ? WHERE Id_Licencia = ?",
      [estado, motivoRechazo || null, id]
    );

    res.json({ message: "Respuesta enviada exitosamente" });
  } catch (error) {
    console.error("Error respondiendo licencia:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
