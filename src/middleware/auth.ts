import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Definir interfaz para el payload del JWT
interface JwtPayload {
  id?: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido" });
    }

    const user = decoded as JwtPayload;

    if (!user.id && user.username) {
      user.id = 1;
    }

    req.user = user;
    next();
  });
};
