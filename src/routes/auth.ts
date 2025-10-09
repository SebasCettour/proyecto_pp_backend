import { Router, Request, Response } from "express";
import { pool } from "../models/db.js";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface LoginBody {
  username: string;
  password: string;
}

interface DBUser extends RowDataPacket {
  Id_Usuario: number;
  Nombre_Usuario: string;
  Correo_Electronico: string;
  Contrasenia: string;
  Id_Rol: number;
  Nombre_Rol?: string;
}

const router = Router();

const verifyPassword = (plainPassword: string, hashedPassword: string): boolean => {
  try {

    if (plainPassword === hashedPassword) {
      console.log("🔐 Password match: texto plano");
      return true;
    }
    
    // ✅ LUEGO INTENTAR BCRYPT (para producción)
    const bcryptMatch = bcrypt.compareSync(plainPassword, hashedPassword);
    if (bcryptMatch) {
      console.log("🔐 Password match: bcrypt");
      return true;
    }
    
    console.log("🔐 Password no match - ni texto plano ni bcrypt");
    return false;
    
  } catch (error) {
    console.log("🔐 Error en verificación bcrypt, probando texto plano");
    return plainPassword === hashedPassword;
  }
};

const generateToken = (payload: { username: string; role: string }) => {
  const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_temporal";
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

// ✅ LOGIN MEJORADO CON LOGS
router.post(
  "/login",
  async (req: Request<{}, any, LoginBody>, res: Response) => {
    const { username, password } = req.body;

    console.log("🔐 LOGIN - Datos recibidos:", { username, password: "***" });

    if (!username || !password) {
      console.log("❌ Faltan credenciales");
      return res.status(400).json({ error: "Faltan credenciales" });
    }

    try {
      console.log("🔍 Buscando usuario en la base de datos...");
      
      // ✅ QUERY CORREGIDA - Usar Nombre_Rol
      const [rows] = await pool.query<DBUser[]>(
        `SELECT u.*, r.Nombre_Rol 
         FROM Usuarios u 
         LEFT JOIN Rol r ON u.Id_Rol = r.Id_Rol 
         WHERE u.Nombre_Usuario = ?`,
        [username]
      );

      console.log("📊 Usuarios encontrados:", rows.length);
      
      if (rows.length === 0) {
        console.log("❌ Usuario no encontrado");
        return res.status(401).json({ error: "Usuario no encontrado" });
      }

      const user = rows[0];

      // === NUEVO: Obtener el documento del usuario desde la tabla Empleado ===
      const [empleadoRows] = await pool.query<any[]>(
        "SELECT Numero_Documento FROM Empleado WHERE Correo_Electronico = ? OR Nombre = ? OR Apellido = ? OR ? IN (Numero_Documento, Legajo)",
        [user.Correo_Electronico, user.Nombre_Usuario, user.Nombre_Usuario, user.Nombre_Usuario]
      );
      let documento = "";
      if (empleadoRows.length > 0) {
        documento = empleadoRows[0].Numero_Documento;
      }

      // ✅ VERIFICAR CONTRASEÑA CON LOGS DETALLADOS
      console.log("🔐 Verificando contraseña...");
      console.log("📊 Password enviado:", password);
      console.log("📊 Password en BD:", user.Contrasenia);
      console.log("📊 Longitud password enviado:", password.length);
      console.log("📊 Longitud password BD:", user.Contrasenia.length);
      console.log("📊 Comparación directa:", password === user.Contrasenia);

      const passwordMatches = verifyPassword(password, user.Contrasenia);
      
      if (!passwordMatches) {
        console.log("❌ Contraseña incorrecta");
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      console.log("✅ Contraseña correcta");

      // ✅ MAPEAR ROL USANDO EL NOMBRE REAL DEL ROL
      let roleFrontend = (user.Nombre_Rol || "").toLowerCase();

      console.log("🎭 Rol asignado:", roleFrontend);

      // ✅ GENERAR TOKEN con documento
      const token = jwt.sign(
        {
          username: user.Nombre_Usuario,
          role: roleFrontend,
          documento: documento, // <-- agrega el documento aquí
        },
        process.env.JWT_SECRET || "tu_clave_secreta_temporal",
        { expiresIn: "24h" }
      );

      console.log("🎫 Token generado exitosamente");

      return res.json({ 
        token, 
        role: roleFrontend,
        user: {
          id: user.Id_Usuario,
          username: user.Nombre_Usuario,
          email: user.Correo_Electronico,
          rol_id: user.Id_Rol,
          rol_name: user.Nombre_Rol,
          documento
        }
      });

    } catch (err) {
      console.error("❌ Error en login:", err);
      return res.status(500).json({ error: "Error del servidor" });
    }
  }
);

// ✅ REGISTER CORREGIDO
router.post(
  "/register",
  async (req: Request, res: Response) => {
    const { username, password, email, roleId } = req.body;

    console.log("📝 REGISTER - Datos recibidos:", { username, email, roleId });

    if (!username || !password || !roleId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    try {
      // ✅ VERIFICAR SI EL USUARIO YA EXISTE
      const [existing] = await pool.query(
        "SELECT * FROM Usuarios WHERE Nombre_Usuario = ?",
        [username]
      );
      
      if ((existing as any).length > 0) {
        return res.status(409).json({ error: "El usuario ya existe" });
      }

      // ✅ HASHEAR PASSWORD
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ SEPARAR NOMBRE Y APELLIDO
      const nombreCompleto = username || "";
      const partesNombre = nombreCompleto.trim().split(" ");
      const nombre = partesNombre[0] || "";
      const apellido = partesNombre.slice(1).join(" ") || "";

      // ✅ INSERTAR USUARIO
      await pool.query(
        "INSERT INTO Usuarios (Nombre_Usuario, Contrasenia, Correo_Electronico, Id_Rol) VALUES (?, ?, ?, ?)",
        [username, hashedPassword, email || null, roleId]
      );

      // ✅ INSERTAR EMPLEADO CON CAMPOS CORRECTOS
      await pool.query(
        `INSERT INTO Empleado (
          Nombre, Apellido, Area, Cargo, Correo_Electronico, Domicilio, Estado_Civil,
          Fecha_Desde, Fecha_Nacimiento, Legajo, Telefono, Tipo_Documento, Numero_Documento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nombre,               
          apellido,                
          req.body.area,
          req.body.cargo,
          email,
          req.body.domicilio,
          req.body.estadoCivil,
          req.body.fechaContrato,
          req.body.fechaNacimiento,
          req.body.legajo,
          req.body.telefono,
          req.body.tipoDocumento,
          req.body.numeroDocumento
        ]
      );

      return res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (err) {
      console.error("❌ Error en register:", err);
      return res.status(500).json({ error: "Error del servidor" });
    }
  }
);

export default router;
