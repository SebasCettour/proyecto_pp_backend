import { JwtPayload } from "../middleware/authMiddleware";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}
