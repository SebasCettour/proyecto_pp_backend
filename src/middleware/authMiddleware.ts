import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  username: string;
  role: string;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret") as JwtPayload;
    req.user = payload; // añadimos la info del usuario al request
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
};
