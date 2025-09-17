import { Router, Request, Response } from "express";
import { verifyPassword, generateToken } from "../auth.js";
import { pool } from "../models/db.js";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";

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
  Nombre_Rol: string;
}

const router = Router();

// LOGIN
router.post(
  "/login",
  async (req: Request<{}, any, LoginBody>, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Faltan credenciales" });
    }

    try {
      // Buscar usuario y rol en la base de datos
      const [rows] = await pool.query<DBUser[]>(
        "SELECT u.*, r.Nombre_Rol FROM Usuarios u JOIN Rol r ON u.Id_Rol = r.Id_Rol WHERE u.Nombre_Usuario = ?",
        [username]
      );

      const user = rows[0];
      if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

      // Verificar contraseña
      const passwordMatches = verifyPassword(password, user.Contrasenia);
      if (!passwordMatches)
        return res.status(401).json({ error: "Contraseña incorrecta" });

      // Generar token JWT con username y rol
      const token = generateToken({
        username: user.Nombre_Usuario,
        role: user.Nombre_Rol.toLocaleLowerCase(),
      });

      return res.json({ token, role: user.Nombre_Rol.toLocaleLowerCase() });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error del servidor" });
    }
  }
);

// REGISTER
router.post(
  "/register",
  async (req: Request, res: Response) => {
    const { username, password, email, roleId } = req.body;

    if (!username || !password || !roleId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    try {
      // Verifica si el usuario ya existe
      const [existing] = await pool.query(
        "SELECT * FROM Usuarios WHERE Nombre_Usuario = ?",
        [username]
      );
      if ((existing as any).length > 0) {
        return res.status(409).json({ error: "El usuario ya existe" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query(
        "INSERT INTO Usuarios (Nombre_Usuario, Contrasenia, Correo_Electronico, Id_Rol) VALUES (?, ?, ?, ?)",
        [username, hashedPassword, email || null, roleId]
      );

      return res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error del servidor" });
    }
  }
);

export default router;
