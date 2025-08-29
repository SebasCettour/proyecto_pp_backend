import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SECRET_KEY = process.env.JWT_SECRET || "supersecret123";

// Hashear contraseña
export const hashPassword = (password: string): string =>
  bcrypt.hashSync(password, 10);

// Verificar contraseña
export const verifyPassword = (password: string, hash: string): boolean =>
  bcrypt.compareSync(password, hash);

// Generar token
export const generateToken = (payload: object): string =>
  jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

// Middleware para rutas protegidas
import { Request, Response, NextFunction } from "express";
export const verifyToken = (
  req: Request & { user?: string | JwtPayload },
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
