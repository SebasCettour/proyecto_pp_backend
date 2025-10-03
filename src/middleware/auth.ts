import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Interfaz para el payload del JWT
export interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

// Interfaz extendida para Request
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Extender la interfaz Request de Express globalmente
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_aqui', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    
    // Asegurar que decoded es del tipo correcto
    req.user = decoded as JwtPayload;
    next();
  });
};