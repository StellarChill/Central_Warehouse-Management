import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.warn(`[AUTH] ❌ No token provided — ${req.method} ${req.path}`);
    return res.sendStatus(401);
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.warn(`[AUTH] ❌ Token verify failed — ${req.method} ${req.path} — ${err.message}`);
      return res.sendStatus(403);
    }
    console.log(`[AUTH] ✅ ${req.method} ${req.path} — userId=${(user as any)?.UserId} role=${(user as any)?.roleCode}`);
    req.user = user;
    next();
  });
}
