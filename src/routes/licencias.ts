import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { pool } from "../models/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

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
        fechaDesde,
        fechaHasta,
        observaciones,
        diagnosticoCIE10_codigo,
        diagnosticoCIE10_descripcion,
      } = req.body;

      const certificadoMedico = req.file ? req.file.filename : null;

      // Validaciones
      if (
        !nombre ||
        !apellido ||
        !documento ||
        !area ||
        !motivo ||
        !fechaDesde ||
        !fechaHasta
      ) {
        return res
          .status(400)
          .json({ message: "Faltan campos obligatorios" });
      }

      if (motivo === "Enfermedad" && (!certificadoMedico || !diagnosticoCIE10_codigo)) {
        return res.status(400).json({
          message:
            "Para licencias por enfermedad se requiere certificado médico y diagnóstico CIE-10",
        });
      }

      // Casting del user para acceder a id
      const user = req.user as { id: number; username: string; role: string } | undefined;

      // Insertar en la base de datos
      const [result] = await pool.execute(
        `INSERT INTO Licencia (
          Id_Empleado, Nombre, Apellido, Documento, Area, Motivo, 
          FechaDesde, FechaHasta, Observaciones, CertificadoMedico,
          DiagnosticoCIE10_Codigo, DiagnosticoCIE10_Descripcion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user?.id || null,
          nombre,
          apellido,
          documento,
          area,
          motivo,
          fechaDesde,
          fechaHasta,
          observaciones || null,
          certificadoMedico,
          diagnosticoCIE10_codigo || null,
          diagnosticoCIE10_descripcion || null,
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

export default router;
