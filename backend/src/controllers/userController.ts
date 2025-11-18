import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function register(req: Request, res: Response) {
	try {
			const { UserName, UserPassword, RoleId, BranchId, Email, TelNumber, LineId, CompanyId: CompanyIdBody } = req.body;
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

			// Resolve CompanyId: prefer provided, otherwise derive from Branch
			let companyIdToUse: number | null = null;
			if (Number.isFinite(Number(CompanyIdBody)) && Number(CompanyIdBody) > 0) {
				companyIdToUse = Number(CompanyIdBody);
			} else if (Number.isFinite(branchToUse) && branchToUse > 0) {
				const br = await prisma.branch.findUnique({ where: { BranchId: branchToUse } });
				if (br) companyIdToUse = br.CompanyId;
			}
			if (!companyIdToUse) {
				return res.status(400).json({ error: 'CompanyId is required (pass CompanyId or a BranchId belonging to a company)' });
			}

			// Check existing by UserName or LineId to return clear errors
			const existingByName = await prisma.user.findUnique({ where: { UserName } });
			if (existingByName) {
				// Return existing user info to help UI/admin locate the duplicate
				return res.status(409).json({ error: 'User already exists', user: {
					UserId: existingByName.UserId,
					UserName: existingByName.UserName,
					UserStatus: existingByName.UserStatus,
					LineId: existingByName.LineId,
					CreatedAt: existingByName.CreatedAt,
					RoleId: existingByName.RoleId,
					BranchId: existingByName.BranchId,
				} });
			}
			if (LineId) {
				const existingByLine = await prisma.user.findFirst({ where: { LineId } });
				if (existingByLine) {
					return res.status(409).json({ error: 'LINE account already registered', user: {
						UserId: existingByLine.UserId,
						UserName: existingByLine.UserName,
						UserStatus: existingByLine.UserStatus,
						LineId: existingByLine.LineId,
						CreatedAt: existingByLine.CreatedAt,
						RoleId: existingByLine.RoleId,
						BranchId: existingByLine.BranchId,
					} });
				}
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
						CompanyId: companyIdToUse!,
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

// Self-service company registration: creates Company, default Branch & Warehouse, and a Company Admin user
export async function registerCompany(req: Request, res: Response) {
	try {
		const {
			CompanyName,
			CompanyAddress,
			TaxId,
			CompanyEmail,
			CompanyTelNumber,
			AdminUserName,
			AdminUserPassword,
			AdminEmail,
			AdminTelNumber,
		} = req.body || {};

		if (!CompanyName) return res.status(400).json({ error: 'CompanyName is required' });
		if (!AdminUserName) return res.status(400).json({ error: 'AdminUserName is required' });
		if (!AdminUserPassword) return res.status(400).json({ error: 'AdminUserPassword is required' });

		// Create a CompanyCode slug
		const baseCode = String(CompanyName).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'COMPANY';
		let companyCode = baseCode;
		let suffix = 1;
		while (await prisma.company.findUnique({ where: { CompanyCode: companyCode } })) {
			companyCode = `${baseCode}-${++suffix}`;
		}

		const company = await prisma.company.create({
			data: {
				CompanyName,
				CompanyAddress: CompanyAddress ?? null,
				TaxId: TaxId ?? null,
				CompanyEmail: CompanyEmail ?? null,
				CompanyTelNumber: CompanyTelNumber ?? null,
				CompanyCode: companyCode,
			},
		});

		// Default Branch
		const branchCode = `${companyCode}-HQ`;
		const branch = await prisma.branch.create({
			data: {
				CompanyId: company.CompanyId,
				BranchName: 'Head Office',
				BranchAddress: CompanyAddress ?? null,
				BranchCode: branchCode,
			},
		});

		// Optional: default Warehouse
		const warehouseCode = `${companyCode}-001`;
		await prisma.warehouse.create({
			data: {
				CompanyId: company.CompanyId,
				WarehouseName: 'Main Warehouse',
				WarehouseAddress: CompanyAddress ?? null,
				WarehouseCode: warehouseCode,
			},
		});

		// Resolve Company Admin role (RoleCode = 'ADMIN')
		const adminRole = await prisma.role.findUnique({ where: { RoleCode: 'ADMIN' } });
		if (!adminRole) return res.status(500).json({ error: 'Admin role not configured' });

		// Ensure unique username
		const existed = await prisma.user.findUnique({ where: { UserName: AdminUserName } });
		if (existed) return res.status(409).json({ error: 'Admin username already exists' });

		const hashed = await bcrypt.hash(AdminUserPassword, 10);
		const adminUser = await prisma.user.create({
			data: {
				CompanyId: company.CompanyId,
				BranchId: branch.BranchId,
				RoleId: adminRole.RoleId,
				UserName: AdminUserName,
				UserPassword: hashed,
				Email: AdminEmail ?? null,
				TelNumber: AdminTelNumber ?? null,
				UserStatus: 'ACTIVE',
			},
			include: { Role: true },
		});

		// Issue JWT
		const token = jwt.sign(
			{
				UserId: adminUser.UserId,
				RoleId: adminUser.RoleId,
				roleCode: (adminUser as any).Role?.RoleCode,
				CompanyId: adminUser.CompanyId,
				BranchId: adminUser.BranchId,
			},
			JWT_SECRET,
			{ expiresIn: '1d' },
		);

		return res.status(201).json({
			token,
			company: {
				CompanyId: company.CompanyId,
				CompanyName: company.CompanyName,
				CompanyCode: company.CompanyCode,
			},
			user: {
				UserId: adminUser.UserId,
				UserName: adminUser.UserName,
				RoleId: adminUser.RoleId,
				roleCode: (adminUser as any).Role?.RoleCode ?? 'ADMIN',
				BranchId: adminUser.BranchId,
				CompanyId: adminUser.CompanyId,
				Email: adminUser.Email,
				UserStatus: adminUser.UserStatus,
			},
		});
	} catch (e: any) {
		console.error('registerCompany failed', e);
		if (e?.code === 'P2002') return res.status(409).json({ error: 'Unique constraint failed' });
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// Public endpoint variant matching /api/public/company-register with nested body
export async function registerCompanyPublic(req: Request, res: Response) {
	try {
		const { company = {}, adminUser = {}, userStatus } = req.body || {};
		const {
			CompanyName,
			CompanyAddress,
			TaxId,
			CompanyEmail,
			CompanyTelNumber,
		} = company;
		const {
			UserName: AdminUserName,
			UserPassword: AdminUserPassword,
			Email: AdminEmail,
			TelNumber: AdminTelNumber,
		} = adminUser;

		if (!CompanyName) return res.status(400).json({ error: 'CompanyName is required' });
		if (!AdminUserName) return res.status(400).json({ error: 'AdminUserName is required' });
		if (!AdminUserPassword) return res.status(400).json({ error: 'AdminUserPassword is required' });

		const result = await prisma.$transaction(async (tx) => {
			// Generate unique CompanyCode
			const baseCode = String(CompanyName).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'COMPANY';
			let companyCode = baseCode;
			let suffix = 1;
			while (await tx.company.findUnique({ where: { CompanyCode: companyCode } })) {
				companyCode = `${baseCode}-${++suffix}`;
			}

			const companyRow = await tx.company.create({
				data: {
					CompanyName,
					CompanyAddress: CompanyAddress ?? null,
					TaxId: TaxId ?? null,
					CompanyEmail: CompanyEmail ?? null,
					CompanyTelNumber: CompanyTelNumber ?? null,
					CompanyCode: companyCode,
				},
			});

			const branch = await tx.branch.create({
				data: {
					CompanyId: companyRow.CompanyId,
					BranchName: 'Head Office',
					BranchAddress: CompanyAddress ?? null,
					BranchCode: `${companyCode}-HQ`,
				},
			});

			await tx.warehouse.create({
				data: {
					CompanyId: companyRow.CompanyId,
					WarehouseName: 'Main Warehouse',
					WarehouseAddress: CompanyAddress ?? null,
					WarehouseCode: `${companyCode}-001`,
				},
			});

			const companyAdminRole = await tx.role.findFirst({
				where: { OR: [{ RoleCode: 'COMPANY_ADMIN' }, { RoleCode: 'ADMIN' }] },
			});
			if (!companyAdminRole) throw new Error('Company Admin role not configured');

			const existed = await tx.user.findUnique({ where: { UserName: AdminUserName } });
			if (existed) return { conflict: true, companyRow } as any;

			const hashed = await bcrypt.hash(AdminUserPassword, 10);
			const status = typeof userStatus === 'string' ? userStatus.toUpperCase() : 'ACTIVE';
			const userRow = await tx.user.create({
				data: {
					CompanyId: companyRow.CompanyId,
					BranchId: branch.BranchId,
					RoleId: companyAdminRole.RoleId,
					UserName: AdminUserName,
					UserPassword: hashed,
					Email: AdminEmail ?? null,
					TelNumber: AdminTelNumber ?? null,
					UserStatus: status,
				},
				include: { Role: true },
			});

			return { companyRow, userRow };
		});

		if ((result as any).conflict) {
			return res.status(409).json({ error: 'Admin username already exists' });
		}

		const { companyRow, userRow } = result as any;

		// Issue token so the new company admin can access immediately
		const token = jwt.sign(
			{
				UserId: userRow.UserId,
				RoleId: userRow.RoleId,
				roleCode: (userRow as any)?.Role?.RoleCode || 'COMPANY_ADMIN',
				CompanyId: userRow.CompanyId,
				BranchId: userRow.BranchId,
			},
			JWT_SECRET,
			{ expiresIn: '1d' },
		);

		return res.status(201).json({
			token,
			company: {
				CompanyId: companyRow.CompanyId,
				CompanyName: companyRow.CompanyName,
				CompanyCode: companyRow.CompanyCode,
			},
			user: {
				UserId: userRow.UserId,
				UserName: userRow.UserName,
				RoleId: userRow.RoleId,
				roleCode: (userRow as any)?.Role?.RoleCode || 'COMPANY_ADMIN',
				CompanyId: userRow.CompanyId,
				BranchId: userRow.BranchId,
				Email: userRow.Email,
				UserStatus: userRow.UserStatus,
			},
		});
	} catch (e: any) {
		console.error('registerCompanyPublic failed', e);
		if (e?.code === 'P2002') return res.status(409).json({ error: 'Unique constraint failed' });
		return res.status(500).json({ error: 'Internal server error' });
	}
}
