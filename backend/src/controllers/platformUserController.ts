import { Request, Response } from 'express';
import prisma from '../prisma';

// List users awaiting platform admin approval (or by status)
export async function listPendingUsers(req: Request, res: Response) {
  try {
    const status = String(req.query.status || 'PENDING').toUpperCase();
    const users = await prisma.user.findMany({
      where: { UserStatusApprove: status },
      select: ({
        UserId: true,
        UserName: true,
        Email: true,
        TelNumber: true,
        LineId: true,
        TempCompanyId: true,
        RequestedRoleText: true,
        UserStatusApprove: true,
        UserStatusActive: true,
        CreatedAt: true,
        TempCompany: {
          select: {
            TempCompanyId: true,
            TempCompanyName: true,
            TempCompanyCode: true,
            TempCompanyAddress: true,
            TempCompanyTaxId: true,
            TempCompanyTelNumber: true,
            TempCompanyEmail: true,
          },
        },
      } as any),
      orderBy: { CreatedAt: 'desc' },
    });
    return res.json(users);
  } catch (e) {
    console.error('listPendingUsers failed', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Approve or reject a signup (platform admin)
export async function setApproval(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { action } = req.body as { action: 'APPROVE' | 'REJECT' };
    if (!id) return res.status(400).json({ error: 'Invalid user id' });
    const next = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const existed = await prisma.user.findUnique({ where: { UserId: id } });
    if (!existed) return res.status(404).json({ error: 'Not found' });

    const user = await prisma.user.update({
      where: { UserId: id },
      data: { UserStatusApprove: next },
      select: {
        UserId: true,
        UserName: true,
        UserStatusApprove: true,
        UserStatusActive: true,
        TempCompanyId: true,
      },
    });
    return res.json(user);
  } catch (e) {
    console.error('setApproval failed', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Assign company/branch/role to a user (platform admin)
export async function assignUserCompany(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { CompanyId, BranchId, RoleId } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Invalid user id' });

    const user = await prisma.user.findUnique({ where: { UserId: id } });
    if (!user) return res.status(404).json({ error: 'Not found' });

    const updates: any = {};

    if (CompanyId) {
      const co = await prisma.company.findUnique({ where: { CompanyId: Number(CompanyId) } });
      if (!co) return res.status(400).json({ error: 'Company not found' });
      updates.CompanyId = Number(CompanyId);
    }

    if (RoleId) {
      const role = await prisma.role.findUnique({ where: { RoleId: Number(RoleId) } });
      if (!role) return res.status(400).json({ error: 'Role not found' });
      updates.RoleId = Number(RoleId);
    }

    if (BranchId) {
      const br = await prisma.branch.findUnique({ where: { BranchId: Number(BranchId) } });
      if (!br) return res.status(400).json({ error: 'Branch not found' });
      if (updates.CompanyId && br.CompanyId !== updates.CompanyId) {
        return res.status(400).json({ error: 'Branch does not belong to selected Company' });
      }
      updates.BranchId = Number(BranchId);
      // If company not provided, derive from branch
      if (!updates.CompanyId) updates.CompanyId = br.CompanyId;
    }

    const updated = await prisma.user.update({
      where: { UserId: id },
      data: updates,
      select: {
        UserId: true,
        UserName: true,
        CompanyId: true,
        BranchId: true,
        RoleId: true,
        UserStatusApprove: true,
        UserStatusActive: true,
      },
    });

    return res.json(updated);
  } catch (e) {
    console.error('assignUserCompany failed', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Company admin can toggle active status for users in their company. This is provided here for clarity,
// but typically you'd expose it in a company-scoped route as well.
export async function setActiveStatus(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: 'ACTIVE' | 'INACTIVE' };
    if (!id) return res.status(400).json({ error: 'Invalid user id' });
    if (!status) return res.status(400).json({ error: 'status required' });

    const existed = await prisma.user.findUnique({ where: { UserId: id } });
    if (!existed) return res.status(404).json({ error: 'Not found' });

    const updated = await prisma.user.update({
      where: { UserId: id },
      data: { UserStatusActive: status },
      select: { UserId: true, UserName: true, UserStatusActive: true },
    });

    return res.json(updated);
  } catch (e) {
    console.error('setActiveStatus failed', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default {};
