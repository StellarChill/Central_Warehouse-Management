import { Request, Response } from 'express';
import prisma from '../prisma';

export async function listUsers(req: Request, res: Response) {
  try {
    const status = (req.query.status as string)?.toUpperCase();
    const where: any = {};
    if (status) where.UserStatus = status;

    const users = await prisma.user.findMany({
      where,
      select: {
        UserId: true,
        UserName: true,
        RoleId: true,
        BranchId: true,
        Email: true,
        LineId: true,
        CreatedAt: true,
        UserStatus: true,
        Branch: {
          select: { BranchName: true },
        },
      },
      orderBy: { CreatedAt: 'desc' },
    });

    // Map to client-friendly shape: include BranchName and alias UserStatus -> status
    const mapped = users.map((u) => ({
      UserId: u.UserId,
      UserName: u.UserName,
      RoleId: u.RoleId,
      BranchId: u.BranchId,
      BranchName: (u as any).Branch?.BranchName || null,
      Email: u.Email,
      LineId: u.LineId,
      CreatedAt: u.CreatedAt,
      status: u.UserStatus || null,
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Failed to list users', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function approveUser(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid user id' });

  const { BranchId, BranchName, status, RoleId } = req.body;

    const data: any = {};
    if (typeof RoleId !== 'undefined') data.RoleId = Number(RoleId);
    if (typeof BranchId !== 'undefined' && Number(BranchId) > 0) data.BranchId = Number(BranchId);
    if (BranchName) {
      // Optionally we could create/find a branch record. For now, store BranchName in User's BranchId if BranchId not provided
      // but since User table doesn't have BranchName, we keep BranchId and let admin manage branches separately
    }
  // Company field is not stored on User model; skip
    if (status) data.UserStatus = status;

    const user = await prisma.user.update({ where: { UserId: id }, data, select: { UserId: true, UserName: true, RoleId: true, BranchId: true, UserStatus: true } });
    return res.json(user);
  } catch (err: any) {
    console.error('Approve user failed', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid user id' });

    const { UserName, Email, RoleId, BranchId, UserStatus, LineId } = req.body;

    const data: any = {};
    if (typeof UserName !== 'undefined') data.UserName = String(UserName);
    if (typeof Email !== 'undefined') data.Email = String(Email);
    if (typeof RoleId !== 'undefined') data.RoleId = Number(RoleId);
    if (typeof BranchId !== 'undefined') data.BranchId = Number(BranchId);
    if (typeof UserStatus !== 'undefined') data.UserStatus = String(UserStatus);
    if (typeof LineId !== 'undefined') data.LineId = String(LineId);

    const user = await prisma.user.update({
      where: { UserId: id },
      data,
      include: { Branch: { select: { BranchName: true } } },
    });

    // Map to client-friendly shape
    const mapped = {
      UserId: user.UserId,
      UserName: user.UserName,
      RoleId: user.RoleId,
      BranchId: user.BranchId,
      BranchName: (user as any).Branch?.BranchName || null,
      Email: user.Email,
      LineId: user.LineId,
      CreatedAt: user.CreatedAt,
      status: user.UserStatus,
    };

    return res.json(mapped);
  } catch (err: any) {
    console.error('Update user failed', err);
    if (err.code === 'P2002') return res.status(409).json({ error: 'Unique constraint failed' });
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid user id' });
    await prisma.user.delete({ where: { UserId: id } });
    return res.status(204).send();
  } catch (err) {
    console.error('Delete user failed', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default {};
