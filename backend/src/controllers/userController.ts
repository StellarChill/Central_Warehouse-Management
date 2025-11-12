import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

export async function register(req: Request, res: Response) {
	try {
			const { UserName, UserPassword, RoleId, BranchId, Email, TelNumber, LineId } = req.body;
			if (!UserName) return res.status(400).json({ error: 'UserName is required' });

			// If no password provided, allow it only when registering via LINE (LineId present)
			if (!UserPassword && !LineId) {
				return res.status(400).json({ error: 'UserPassword is required when not registering via LINE' });
			}

			// Normalize numeric ids: treat 0 or invalid as unset so defaults apply
			const roleIdNum = Number(RoleId);
			const branchIdNum = Number(BranchId);
			const roleToUse = Number.isFinite(roleIdNum) && roleIdNum > 0 ? roleIdNum : 3; // default BRANCH
			const branchToUse = Number.isFinite(branchIdNum) && branchIdNum > 0 ? branchIdNum : 1;

			// Check existing by UserName or LineId to return clear errors
			const existingByName = await prisma.user.findUnique({ where: { UserName } });
			if (existingByName) return res.status(409).json({ error: 'User already exists' });
			if (LineId) {
				const existingByLine = await prisma.user.findFirst({ where: { LineId } });
				if (existingByLine) return res.status(409).json({ error: 'LINE account already registered' });
			}

			// If password missing (LIFF flow), generate a random one so user cannot login via password
			let passwordToHash = UserPassword;
			if (!passwordToHash) {
				const crypto = await import('crypto');
				passwordToHash = crypto.randomBytes(16).toString('hex');
			}

			const hashed = await bcrypt.hash(passwordToHash, 10);

			try {
				const user = await prisma.user.create({
					data: {
						UserName,
						UserPassword: hashed,
						RoleId: roleToUse,
						BranchId: branchToUse,
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
			} catch (e: any) {
				console.error('Prisma create user failed', e);
				// Prisma constraint error -> return meaningful message
				if (e.code === 'P2002') {
					return res.status(409).json({ error: 'Unique constraint failed' });
				}
				return res.status(500).json({ error: 'Internal server error' });
			}
    
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

export default {};
