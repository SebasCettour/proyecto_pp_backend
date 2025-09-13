import { Router, Request, Response } from "express";
import { hashPassword, verifyPassword, generateToken } from "../auth.js";
import { pool } from "../models/db.js";
import { RowDataPacket } from "mysql2";

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
        "SELECT u.*, r.Nombre_Rol FROM User u JOIN Rol r ON u.Id_Rol = r.Id_Rol WHERE Nombre_Usuario = ?",
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
        role: user.Nombre_Rol,
      });

      return res.json({ token, role: user.Nombre_Rol });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error del servidor" });
    }
  }
);

export default router;
