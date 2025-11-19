// backend/src/controllers/loginController.ts
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

  const user = await prisma.user.findUnique({
    where: { UserName },
    include: { Role: true },
  });
  console.log('user', user);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials A1' });
  }

  const valid = await bcrypt.compare(UserPassword, user.UserPassword);
  console.log('valid', valid);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials A2' });
  }

  // Enforce new approval/active checks
  // Block if platform admin hasn't approved yet
  if (user.UserStatusApprove && user.UserStatusApprove !== 'APPROVED') {
    return res.status(403).json({ error: `User not approved (${user.UserStatusApprove})` });
  }
  // Block if user has been deactivated
  if (user.UserStatusActive && user.UserStatusActive !== 'ACTIVE') {
    return res.status(403).json({ error: `User inactive (${user.UserStatusActive})` });
  }
  // Block if company not yet active/approved
  if (user.CompanyId) {
    const co = await prisma.company.findUnique({ where: { CompanyId: user.CompanyId }, select: { CompanyStatus: true } });
    if (co && co.CompanyStatus && co.CompanyStatus !== 'ACTIVE') {
      return res.status(403).json({ error: `Company not approved (${co.CompanyStatus})` });
    }
  }

  const token = jwt.sign(
    {
      UserId: user.UserId,
      RoleId: user.RoleId,
      roleCode: (user as any).Role?.RoleCode,
      CompanyId: user.CompanyId,
      BranchId: user.BranchId,
    },
    JWT_SECRET,
    { expiresIn: '1d' },
  );

  return res.json({
    token,
    user: {
      UserId: user.UserId,
      UserName: user.UserName,
      RoleId: user.RoleId,
      roleCode: (user as any).Role?.RoleCode ?? null,
      BranchId: user.BranchId,
      CompanyId: user.CompanyId,
      Email: user.Email,
      UserStatusApprove: (user as any).UserStatusApprove ?? null,
      UserStatusActive: (user as any).UserStatusActive ?? null,
    },
  });
}

// 🔥 Login ด้วย LINE (LineId หรือ id_token)
export async function loginWithLine(req: Request, res: Response) {
  const { id_token: idToken, LineId } = req.body;

  let lineUserId: string | null = null;

  if (idToken) {
    // Verify id_token กับ LINE
    try {
      const clientId =
        process.env.LINE_CHANNEL_ID ||
        process.env.LINE_CLIENT_ID ||
        process.env.LIFF_ID;

      if (!clientId) {
        console.warn(
          'LINE client_id not configured in env (LINE_CHANNEL_ID / LINE_CLIENT_ID / LIFF_ID)',
        );
        return res
          .status(500)
          .json({ error: 'Server misconfiguration: LINE client id missing' });
      }

      const params = new URLSearchParams();
      params.append('id_token', idToken);
      params.append('client_id', clientId);

      const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!verifyRes.ok) {
        const body = await verifyRes.text().catch(() => '');
        console.warn('LINE id_token verify failed:', verifyRes.status, body);
        return res.status(401).json({ error: 'Invalid id_token' });
      }

      const verifyData: any = await verifyRes.json();
      const aud = verifyData.aud;
      const exp = verifyData.exp;

      if (!aud || !exp) {
        console.warn('LINE verify response missing aud/exp', verifyData);
        return res
          .status(401)
          .json({ error: 'Invalid id_token (missing claims)' });
      }

      if (aud !== clientId) {
        console.warn('LINE id_token audience mismatch', { aud, clientId });
        return res.status(401).json({ error: 'id_token audience mismatch' });
      }

      const now = Math.floor(Date.now() / 1000);
      if (exp < now) {
        console.warn('LINE id_token expired', { exp, now });
        return res.status(401).json({ error: 'id_token expired' });
      }

      // sub = LINE userId
      lineUserId = verifyData.sub;
    } catch (err) {
      console.error('Error verifying LINE id_token', err);
      return res.status(500).json({ error: 'Failed to verify id_token' });
    }
  } else if (LineId) {
    // legacy: รับ LineId ตรง ๆ (จาก profile.userId)
    lineUserId = LineId;
  } else {
    return res.status(400).json({ error: 'id_token or LineId required' });
  }

  // หา user จาก LineId
  const user = await prisma.user.findFirst({
    where: { LineId: lineUserId ?? undefined },
    include: { Role: true },
  });

  if (!user) {
    return res
      .status(404)
      .json({ error: 'User not found. Please register.' });
  }

  // ❗ ถ้า user ยัง PENDING ให้บอกไปเลยว่ารออนุมัติอยู่
  // New gating on approval + active
  if (user.UserStatusApprove && user.UserStatusApprove !== 'APPROVED') {
    return res.status(403).json({ error: 'User is pending approval', status: user.UserStatusApprove });
  }
  if (user.UserStatusActive && user.UserStatusActive !== 'ACTIVE') {
    return res.status(403).json({ error: 'User inactive', status: user.UserStatusActive });
  }
  if (user.CompanyId) {
    const co = await prisma.company.findUnique({ where: { CompanyId: user.CompanyId }, select: { CompanyStatus: true } });
    if (co && co.CompanyStatus && co.CompanyStatus !== 'ACTIVE') {
      return res.status(403).json({ error: 'Company not approved', status: co.CompanyStatus });
    }
  }

  const token = jwt.sign(
    {
      UserId: user.UserId,
      RoleId: user.RoleId,
      roleCode: (user as any).Role?.RoleCode,
      CompanyId: user.CompanyId,
      BranchId: user.BranchId,
    },
    JWT_SECRET,
    { expiresIn: '1d' },
  );

  return res.json({
    token,
    user: {
      UserId: user.UserId,
      UserName: user.UserName,
      RoleId: user.RoleId,
      roleCode: (user as any).Role?.RoleCode ?? null,
      BranchId: user.BranchId,
      CompanyId: user.CompanyId,
      Email: user.Email,
      UserStatusApprove: (user as any).UserStatusApprove ?? null,
      UserStatusActive: (user as any).UserStatusActive ?? null,
    },
  });
}

export default {
  login,
  loginWithLine,
};
