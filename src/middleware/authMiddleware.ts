import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extiende el tipo Request para incluir 'user'
declare module "express-serve-static-core" {
  interface Request {
    user?: string | jwt.JwtPayload;
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    );
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
};
