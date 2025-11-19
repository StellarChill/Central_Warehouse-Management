import { Request, Response } from 'express';
import prisma from '../prisma';
import { getCompanyId, httpError } from '../utils/context';

export async function listUsers(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const status = (req.query.status as string)?.toUpperCase();
    const approve = (req.query.approve as string)?.toUpperCase();
    const active = (req.query.active as string)?.toUpperCase();
    const where: any = { CompanyId };
    // Back-compat: if `status` passed, interpret APPROVED/PENDING/REJECTED as approval; ACTIVE/INACTIVE as active
    if (status === 'APPROVED' || status === 'PENDING' || status === 'REJECTED') where.UserStatusApprove = status;
    if (status === 'ACTIVE' || status === 'INACTIVE') where.UserStatusActive = status;
    if (approve) where.UserStatusApprove = approve;
    if (active) where.UserStatusActive = active;

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
        UserStatusApprove: true,
        UserStatusActive: true,
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
      // Derived overall status for legacy UIs
      status: u.UserStatusApprove !== 'APPROVED' ? u.UserStatusApprove : (u.UserStatusActive === 'ACTIVE' ? 'ACTIVE' : (u.UserStatusActive || null)),
      UserStatusApprove: (u as any).UserStatusApprove,
      UserStatusActive: (u as any).UserStatusActive,
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Failed to list users', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function approveUser(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid user id' });

  const { BranchId, BranchName, status, RoleId, UserStatusApprove, UserStatusActive } = req.body;

    const data: any = {};
    if (typeof RoleId !== 'undefined') data.RoleId = Number(RoleId);
    if (typeof BranchId !== 'undefined' && Number(BranchId) > 0) data.BranchId = Number(BranchId);
    if (BranchName) {
      // Optionally we could create/find a branch record. For now, store BranchName in User's BranchId if BranchId not provided
      // but since User table doesn't have BranchName, we keep BranchId and let admin manage branches separately
    }
    // Explicit fields take precedence
    if (UserStatusApprove) data.UserStatusApprove = String(UserStatusApprove).toUpperCase();
    if (UserStatusActive) data.UserStatusActive = String(UserStatusActive).toUpperCase();
    // Back-compat single `status` param mapping
    if (status) {
      const up = String(status).toUpperCase();
      if (up === 'APPROVED' || up === 'PENDING' || up === 'REJECTED') data.UserStatusApprove = up;
      if (up === 'ACTIVE' || up === 'INACTIVE') data.UserStatusActive = up;
    }
    const existed = await prisma.user.findFirst({ where: { UserId: id, CompanyId } });
    if (!existed) throw httpError(404, 'Not found');
    const user = await prisma.user.update({ where: { UserId: id }, data, select: { UserId: true, UserName: true, RoleId: true, BranchId: true, UserStatusApprove: true, UserStatusActive: true } });
    return res.json(user);
  } catch (err: any) {
    console.error('Approve user failed', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid user id' });

    const { UserName, Email, RoleId, BranchId, UserStatusApprove, UserStatusActive, LineId } = req.body;

    const data: any = {};
    if (typeof UserName !== 'undefined') data.UserName = String(UserName);
    if (typeof Email !== 'undefined') data.Email = String(Email);
    if (typeof RoleId !== 'undefined') data.RoleId = Number(RoleId);
    if (typeof BranchId !== 'undefined') data.BranchId = Number(BranchId);
    if (typeof UserStatusApprove !== 'undefined') data.UserStatusApprove = String(UserStatusApprove).toUpperCase();
    if (typeof UserStatusActive !== 'undefined') data.UserStatusActive = String(UserStatusActive).toUpperCase();
    if (typeof LineId !== 'undefined') data.LineId = String(LineId);

    const existed = await prisma.user.findFirst({ where: { UserId: id, CompanyId } });
    if (!existed) throw httpError(404, 'Not found');
    const user = await prisma.user.update({ where: { UserId: id }, data, include: { Branch: { select: { BranchName: true } } } });

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
      status: (user as any).UserStatusApprove !== 'APPROVED' ? (user as any).UserStatusApprove : ((user as any).UserStatusActive === 'ACTIVE' ? 'ACTIVE' : (user as any).UserStatusActive),
      UserStatusApprove: (user as any).UserStatusApprove,
      UserStatusActive: (user as any).UserStatusActive,
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
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid user id' });
    const existed = await prisma.user.findFirst({ where: { UserId: id, CompanyId } });
    if (!existed) return res.status(404).json({ error: 'Not found' });
    await prisma.user.delete({ where: { UserId: id } });
    return res.status(204).send();
  } catch (err) {
    console.error('Delete user failed', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default {};
