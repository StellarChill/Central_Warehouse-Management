import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function requireRoles(...allowed: string[]) {
  const allowedSet = new Set(allowed.map((r) => r.toUpperCase()));
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.user?.roleCode || '').toUpperCase();
    if (!role) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedSet.has(role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}
