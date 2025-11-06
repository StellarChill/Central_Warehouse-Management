import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function login(req: Request, res: Response) {
  const { UserName, UserPassword } = req.body;
  if (!UserName || !UserPassword) {
    return res.status(400).json({ error: 'UserName and UserPassword required' });
  }
  const user = await prisma.user.findUnique({ where: { UserName } });
  console.log("user", user);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials A1' });
  }

  if (user.UserStatus !== 'ACTIVE') {
    return res.status(403).json({ error: 'Account not approved' });
  }
  const valid = await bcrypt.compare(UserPassword, user.UserPassword);
  console.log("valid", valid);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials A2' });
  }
  const token = jwt.sign({ UserId: user.UserId, RoleId: user.RoleId }, JWT_SECRET, { expiresIn: '1d' });
  return res.json({ token, user: { UserId: user.UserId, UserName: user.UserName, RoleId: user.RoleId, BranchId: user.BranchId } });
}
