import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../models/db.js";
import { authenticateToken } from "../middleware/auth.js";
const router = express.Router();

// Crear carpeta si no existe
const createUploadDir = () => {
  if (!fs.existsSync("uploads/certificados")) {
    fs.mkdirSync("uploads/certificados", { recursive: true });
  }
};

createUploadDir();

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/certificados/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Crear solicitud de licencia
router.post(
  "/solicitar",
  authenticateToken,
  upload.single("certificadoMedico"),
  async (req: Request, res: Response) => {
    try {
      console.log("=== DEBUG SOLICITUD LICENCIA ===");
      console.log("req.body:", req.body);
      console.log("req.file:", req.file);
      console.log("req.user:", req.user);
      console.log("================================");

      const {
        nombre,
        apellido,
        documento,
        area,
        motivo,
        observaciones,
        diagnosticoCIE10_codigo,
        diagnosticoCIE10_descripcion,
        fechaInicio,
        fechaFin,
      } = req.body;

      const certificadoMedico = req.file ? req.file.filename : null;

      // Validaciones básicas
      if (
        !nombre ||
        !apellido ||
        !documento ||
        !area ||
        !motivo ||
        !fechaInicio ||
        !fechaFin
      ) {
        console.log("Error: Faltan campos obligatorios");
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }

      // Validación específica para enfermedad
      if (
        motivo === "Enfermedad" &&
        (!certificadoMedico || !diagnosticoCIE10_codigo)
      ) {
        return res.status(400).json({
          message:
            "Para licencias por enfermedad se requiere certificado médico y diagnóstico CIE-10",
        });
      }

      const user = req.user as
        | {
            id?: number;
            username: string;
            role: string;
            iat: number;
            exp: number;
          }
        | undefined;

      // Validar que el usuario esté autenticado
      if (!user || !user.username) {
        console.log("Error: Usuario no autenticado");
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      console.log("Usuario autenticado:", user);

      let userId = user.id;
      if (!userId) {
        console.log("Obteniendo ID del usuario desde la base de datos...");
        try {
          console.log(
            "Ejecutando query para obtener ID del usuario:",
            user.username
          );

          const [userRows] = await pool.execute(
            "SELECT Id_Usuario FROM Usuarios WHERE Nombre_Usuario = ?",
            [user.username]
          );

          console.log("Resultado de la query userRows:", userRows);

          if (Array.isArray(userRows) && userRows.length > 0) {
            userId = (userRows[0] as any).Id_Usuario;
            console.log("ID del usuario obtenido:", userId);
          } else {
            console.log("Usuario no encontrado en la base de datos");
            return res.status(401).json({ message: "Usuario no encontrado" });
          }
        } catch (dbError) {
          console.error("Error obteniendo ID del usuario:", dbError);
          return res
            .status(500)
            .json({ message: "Error interno del servidor" });
        }
      }

      console.log("ID final del usuario:", userId);

      // Buscar el Id_Empleado real usando el documento
      const [empleadoRows] = await pool.execute(
        "SELECT Id_Empleado FROM Empleado WHERE Numero_Documento = ?",
        [documento]
      );

      if (!Array.isArray(empleadoRows) || empleadoRows.length === 0) {
        return res.status(400).json({ message: "Empleado no encontrado" });
      }

      const idEmpleado = (empleadoRows[0] as any).Id_Empleado;

      const [result] = await pool.execute(
        `INSERT INTO Licencia (
          Id_Empleado, Nombre, Apellido, Documento, Area, Motivo, 
          Observaciones, CertificadoMedico, DiagnosticoCIE10_Codigo, 
          DiagnosticoCIE10_Descripcion, FechaInicio, FechaFin, Estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idEmpleado,
          nombre,
          apellido,
          documento,
          area,
          motivo,
          observaciones || null,
          certificadoMedico,
          diagnosticoCIE10_codigo || null,
          diagnosticoCIE10_descripcion || null,
          fechaInicio,
          fechaFin,
          "Pendiente",
        ]
      );

      console.log("Licencia creada con ID:", (result as any).insertId);

      res.status(201).json({
        message: "Solicitud de licencia creada exitosamente",
        licenciaId: (result as any).insertId,
      });
    } catch (error) {
      console.error("Error creando solicitud de licencia:", error);
      console.error("Stack trace:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
);

// Obtener licencias pendientes
router.get(
  "/pendientes",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const [licencias] = await pool.execute(
        "SELECT * FROM Licencia WHERE Estado = 'Pendiente' ORDER BY FechaSolicitud DESC"
      );
      res.json(licencias);
    } catch (error) {
      console.error("Error obteniendo licencias:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
);

// Responder solicitud
router.put(
  "/responder/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
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
  }
);

// Obtener licencias de un empleado por documento
router.get(
  "/mis-licencias/:documento",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documento } = req.params;
      const [licencias] = await pool.execute(
        "SELECT * FROM Licencia WHERE Documento = ? ORDER BY FechaSolicitud DESC",
        [documento]
      );
      res.json(licencias);
    } catch (error) {
      console.error("Error obteniendo licencias del empleado:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
);

export default router;
