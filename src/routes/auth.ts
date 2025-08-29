import { Router, Request, Response } from "express";
import { hashPassword, verifyPassword, generateToken } from "../auth.js";

// Definimos una interfaz para el cuerpo de la solicitud
interface LoginBody {
  username: string;
  password: string;
}

const router = Router();

// Superadmin de prueba
const SUPERADMIN = {
  username: "superadmin",
  password: hashPassword("supersecret123"),
};

// POST /auth/login
router.post("/login", (req: Request<{}, any, LoginBody>, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }

  if (username !== SUPERADMIN.username) {
    return res.status(401).json({ error: "Usuario no encontrado" });
  }

  if (!verifyPassword(password, SUPERADMIN.password)) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  const token = generateToken({ username, role: "superadmin" });
  return res.json({ token });
});

export default router;
