import { Request, Response } from 'express';
import prisma from '../prisma';

// List roles. PLATFORM_ADMIN sees all.
// Other users: hide PLATFORM_* roles for safety (unless you want them visible for selection).
export async function listRoles(req: Request, res: Response) {
  try {
    const roleCode = (req as any).user?.roleCode?.toUpperCase?.() || '';

    const where: any = {};
    if (roleCode !== 'PLATFORM_ADMIN') {
      where.RoleCode = { notIn: ['PLATFORM_ADMIN', 'PLATFORM_STAFF'] };
    }

    const roles = await prisma.role.findMany({
      where,
      orderBy: { RoleName: 'asc' },
      select: { RoleId: true, RoleName: true, RoleCode: true },
    });

    res.json(roles);
  } catch (e: any) {
    console.error('Failed to list roles', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default { listRoles };
