import { Router, Request, Response } from "express";
import { hashPassword, verifyPassword, generateToken } from "../auth.js";

const router = Router();

// Superadmin de prueba
const SUPERADMIN = {
  username: "superadmin",
  password: hashPassword("supersecret123")
};

// POST /auth/login
router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };

  if (username !== SUPERADMIN.username)
    return res.status(401).json({ error: "Usuario no encontrado" });

  if (!verifyPassword(password, SUPERADMIN.password))
    return res.status(401).json({ error: "Contraseña incorrecta" });

  const token = generateToken({ username, role: "superadmin" });
  return res.json({ token });
});

export default router;
