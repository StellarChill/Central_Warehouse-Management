import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

export async function register(req: Request, res: Response) {
	try {
		const { UserName, UserPassword, RoleId, BranchId, Email, TelNumber, LineId } = req.body;
		if (!UserName) {
			return res.status(400).json({ error: 'UserName is required' });
		}

		// If no password provided, allow it only when registering via LINE (LineId present)
		if (!UserPassword && !LineId) {
			return res.status(400).json({ error: 'UserPassword is required when not registering via LINE' });
		}

		const existing = await prisma.user.findUnique({ where: { UserName } });
		if (existing) return res.status(409).json({ error: 'User already exists' });

		// If password missing (LIFF flow), generate a random one so user cannot login via password
		let passwordToHash = UserPassword;
		if (!passwordToHash) {
			const crypto = await import('crypto');
			passwordToHash = crypto.randomBytes(16).toString('hex');
		}

		const hashed = await bcrypt.hash(passwordToHash, 10);

			const user = await prisma.user.create({
			data: {
				UserName,
				UserPassword: hashed,
				RoleId: RoleId ?? 3, // default to BRANCH (less privileged) if not provided
				BranchId: BranchId ?? 1,
				Email,
				TelNumber,
				LineId,
					UserStatus: 'PENDING',
				},
			select: {
				UserId: true,
				UserName: true,
				RoleId: true,
				BranchId: true,
				Email: true,
				TelNumber: true,
				LineId: true,
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
