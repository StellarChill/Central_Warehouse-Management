import { Request, Response } from 'express';
import prisma from '../prisma';

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        UserId: true,
        UserName: true,
        Email: true,
        TelNumber: true,
        LineId: true,
        UserStatus: true,
        RoleId: true,
        BranchId: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  const { userId } = req.params;
  const { status } = req.body; // 'ACTIVE' or 'INACTIVE'

  if (!['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { UserId: parseInt(userId, 10) },
      data: { UserStatus: status },
      select: {
        UserId: true,
        UserStatus: true,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
}
