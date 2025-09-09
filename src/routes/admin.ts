import { Router, Request, Response } from "express";
import { authenticateToken } from "middleware/authMiddleware.js";

const router = Router();

// Ruta protegida solo para superadmin
router.get("/dashboard", authenticateToken, (req: Request, res: Response) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  res.json({ msg: `Bienvenido al dashboard, ${req.user.username}` });
});

export default router;
