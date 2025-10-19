import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

export async function register(req: Request, res: Response) {
	try {
		const { UserName, UserPassword, RoleId = 1, BranchId = 1, Email, TelNumber } = req.body;
		if (!UserName || !UserPassword) {
			return res.status(400).json({ error: 'UserName and UserPassword are required' });
		}

		const existing = await prisma.user.findUnique({ where: { UserName } });
		if (existing) return res.status(409).json({ error: 'User already exists' });

		const hashed = await bcrypt.hash(UserPassword, 10);
		const user = await prisma.user.create({
			data: {
				UserName,
				UserPassword: hashed,
				RoleId,
				BranchId,
				Email,
				TelNumber,
			},
			select: {
				UserId: true,
				UserName: true,
				RoleId: true,
				BranchId: true,
				Email: true,
				TelNumber: true,
				CreatedAt: true,
			},
		});

		return res.status(201).json({ user });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

export default {};
