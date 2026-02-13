import { Request, Response } from 'express';
import prisma from '../prisma';
import { getCompanyId } from '../utils/context';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function register(req: Request, res: Response) {
	try {
		const { UserName, UserPassword, RoleId, BranchId, Email, TelNumber, LineId, CompanyId: CompanyIdBody, RequestedRoleText, RoleText, RequestedRole } = req.body;
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
			return res.status(409).json({
				error: 'User already exists', user: {
					UserId: existingByName.UserId,
					UserName: existingByName.UserName,
					LineId: existingByName.LineId,
					CreatedAt: existingByName.CreatedAt,
					RoleId: existingByName.RoleId,
					BranchId: existingByName.BranchId,
				}
			});
		}
		if (LineId) {
			const existingByLine = await prisma.user.findFirst({ where: { LineId } });
			if (existingByLine) {
				return res.status(409).json({
					error: 'LINE account already registered', user: {
						UserId: existingByLine.UserId,
						UserName: existingByLine.UserName,
						LineId: existingByLine.LineId,
						CreatedAt: existingByLine.CreatedAt,
						RoleId: existingByLine.RoleId,
						BranchId: existingByLine.BranchId,
					}
				});
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
				data: ({
					CompanyId: companyIdToUse!,
					UserName,
					UserPassword: hashed,
					RoleId: roleToUse,
					BranchId: branchToUse,
					Email,
					TelNumber,
					LineId,
					RequestedRoleText: (RequestedRoleText || RoleText || RequestedRole) ?? null,
				} as any),
				select: ({
					UserId: true,
					UserName: true,
					RoleId: true,
					BranchId: true,
					Email: true,
					TelNumber: true,
					LineId: true,
					RequestedRoleText: true,
					CreatedAt: true,
				} as any),
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

// Public signup with TempCompany. User will be approved by platform admin later.
// ... (imports เดิม)

// Public signup with TempCompany or via LINE
export async function registerPublic(req: Request, res: Response) {
	try {
		const { UserName, UserPassword, LineId, Email, TelNumber, tempCompany = {}, TempCompanyId, RequestedRoleText, RoleText, RequestedRole } = req.body || {};
		if (!UserName) return res.status(400).json({ error: 'UserName is required' });

		// Check duplicates
		const existedByName = await prisma.user.findUnique({ where: { UserName } });
		if (existedByName) return res.status(409).json({ error: 'User already exists' });
		if (LineId) {
			const existedByLine = await prisma.user.findFirst({ where: { LineId } });
			if (existedByLine) return res.status(409).json({ error: 'LINE account already registered' });
		}

		// Resolve or create TempCompany
		let tempId: number | null = null;
		if (TempCompanyId) {
			const tmp = await prisma.tempCompany.findUnique({ where: { TempCompanyId: Number(TempCompanyId) } });
			if (!tmp) return res.status(400).json({ error: 'TempCompanyId not found' });
			tempId = tmp.TempCompanyId;
		} else {
			const { TempCompanyName, TempCompanyCode, TempCompanyAddress, TempCompanyTaxId, TempCompanyTelNumber, TempCompanyEmail } = tempCompany || {};
			if (!TempCompanyName) return res.status(400).json({ error: 'TempCompanyName is required' });

			const base = String(TempCompanyCode || TempCompanyName).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'TEMP-CO';
			let code = base;
			let i = 1;
			while (await prisma.tempCompany.findUnique({ where: { TempCompanyCode: code } })) {
				code = `${base}-${++i}`;
			}
			const created = await prisma.tempCompany.create({
				data: { TempCompanyName, TempCompanyCode: code, TempCompanyAddress: TempCompanyAddress ?? null, TempCompanyTaxId: TempCompanyTaxId ?? null, TempCompanyTelNumber: TempCompanyTelNumber ?? null, TempCompanyEmail: TempCompanyEmail ?? null },
			});
			tempId = created.TempCompanyId;
		}

		// Password handling
		let pwd = UserPassword as string | undefined;
		if (!pwd) {
			const crypto = await import('crypto');
			pwd = crypto.randomBytes(16).toString('hex');
		}
		const hashed = await bcrypt.hash(pwd, 10);

		// Place under PLATFORM company temporarily
		const platform = await prisma.company.findUnique({ where: { CompanyCode: 'PLATFORM' } });
		if (!platform) return res.status(500).json({ error: 'Platform company not configured' });

		// Default branch (Platform HQ or find any)
		const platformBranch = await prisma.branch.findFirst({ where: { CompanyId: platform.CompanyId } });
		if (!platformBranch) return res.status(500).json({ error: 'Platform branch not configured' });

		// --- แก้ไขจุดนี้: ให้ Default Role เป็น REQUESTER ---
		const requesterRole = await prisma.role.findFirst({ where: { RoleCode: 'REQUESTER' } });
		// ถ้าไม่มี REQUESTER ให้ fallback ไป VIEWER
		const fallbackRole = await prisma.role.findFirst({ where: { RoleCode: 'VIEWER' } });
		const roleToUse = requesterRole || fallbackRole;

		if (!roleToUse) return res.status(500).json({ error: 'Default role (REQUESTER) not configured' });

		const user = await prisma.user.create({
			data: ({
				CompanyId: platform.CompanyId,
				BranchId: platformBranch.BranchId,
				RoleId: roleToUse.RoleId,
				UserName,
				UserPassword: hashed,
				Email: Email ?? null,
				TelNumber: TelNumber ?? null,
				LineId: LineId ?? null,
				TempCompanyId: tempId,
				RequestedRoleText: (RequestedRoleText || RoleText || RequestedRole) ?? null,
				UserStatusApprove: 'PENDING',
				UserStatusActive: 'ACTIVE',
			} as any),
			select: ({ UserId: true, UserName: true, UserStatusApprove: true, CreatedAt: true } as any),
		});

		return res.status(201).json({
			message: 'Signup submitted. Waiting for admin approval.',
			user,
		});
	} catch (e: any) {
		console.error('registerPublic failed', e);
		if (e?.code === 'P2002') return res.status(409).json({ error: 'Unique constraint failed' });
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// ... (Functions อื่นๆ ใน userController ให้คงเดิม)

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
				CompanyStatus: 'PENDING', // require platform approval before login
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
				UserStatusApprove: 'PENDING', // require approval
				UserStatusActive: 'ACTIVE',
			},
			include: { Role: true },
		});

		return res.status(201).json({
			message: 'Company registration submitted. Waiting for platform approval.',
			company: {
				CompanyId: company.CompanyId,
				CompanyName: company.CompanyName,
				CompanyCode: company.CompanyCode,
				CompanyStatus: company.CompanyStatus,
			},
			adminUser: {
				UserId: adminUser.UserId,
				UserName: adminUser.UserName,
				UserStatusApprove: adminUser.UserStatusApprove,
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
		const { company = {}, adminUser = {} } = req.body || {};
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
					CompanyStatus: 'PENDING',
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
				where: { RoleCode: 'COMPANY_ADMIN' },
			}) ?? await tx.role.findFirst({
				where: { RoleCode: 'ADMIN' },
			});
			if (!companyAdminRole) throw new Error('Company Admin role not configured');

			const existed = await tx.user.findUnique({ where: { UserName: AdminUserName } });
			if (existed) return { conflict: true, companyRow } as any;

			const hashed = await bcrypt.hash(AdminUserPassword, 10);
			const userRow = await tx.user.create({
				data: {
					CompanyId: companyRow.CompanyId,
					BranchId: branch.BranchId,
					RoleId: companyAdminRole.RoleId,
					UserName: AdminUserName,
					UserPassword: hashed,
					Email: AdminEmail ?? null,
					TelNumber: AdminTelNumber ?? null,
					UserStatusApprove: 'PENDING',
					UserStatusActive: 'ACTIVE',
				},
				include: { Role: true },
			});

			return { companyRow, userRow };
		});

		if ((result as any).conflict) {
			return res.status(409).json({ error: 'Admin username already exists' });
		}

		const { companyRow, userRow } = result as any;

		return res.status(201).json({
			message: 'Company registration submitted. Waiting for platform approval.',
			company: {
				CompanyId: companyRow.CompanyId,
				CompanyName: companyRow.CompanyName,
				CompanyCode: companyRow.CompanyCode,
				CompanyStatus: companyRow.CompanyStatus,
			},
			adminUser: {
				UserId: userRow.UserId,
				UserName: userRow.UserName,
				UserStatusApprove: userRow.UserStatusApprove,
			},
		});
	} catch (e: any) {
		console.error('registerCompanyPublic failed', e);
		if (e?.code === 'P2002') return res.status(409).json({ error: 'Unique constraint failed' });
		return res.status(500).json({ error: 'Internal server error' });
	}
}

export async function getAllUsers(req: Request, res: Response) {
	try {
		const users = await prisma.user.findMany();
		res.json(users);
	} catch (error) {
		console.error('Error fetching users:', error);
		res.status(500).json({ error: 'Failed to fetch users' });
	}
}

// Company-scoped users: platform admin can override via ?companyId= or x-company-id header
export async function getCompanyUsers(req: Request, res: Response) {
	try {
		const roleCode = (req as any).user?.roleCode?.toUpperCase?.() || '';
		const overrideRawHeader = req.headers['x-company-id'];
		const overrideRaw = (Array.isArray(overrideRawHeader) ? overrideRawHeader[0] : overrideRawHeader) ?? (req.query.companyId as any) ?? (req.body?.CompanyId ?? req.body?.companyId);

		// PLATFORM_ADMIN: if no override provided, return all users; else filter by the override
		let whereClause: any = undefined;
		if (roleCode === 'PLATFORM_ADMIN') {
			if (overrideRaw !== undefined) {
				const cid = Number(overrideRaw);
				if (!Number.isFinite(cid) || cid <= 0) return res.status(400).json({ error: 'Invalid companyId' });
				whereClause = { CompanyId: cid };
			}
		} else {
			// Company users: always scope to their own company
			const CompanyId = getCompanyId(req, true)!;
			whereClause = { CompanyId };
		}

		const users = await prisma.user.findMany({
			where: whereClause,
			select: {
				UserId: true,
				UserName: true,
				RoleId: true,
				BranchId: true,
				Email: true,
				TelNumber: true,
				LineId: true,
				CreatedAt: true,
				UserStatusApprove: true,
				UserStatusActive: true,
			},
			orderBy: { CreatedAt: 'desc' },
		});
		res.json(users);
	} catch (error: any) {
		console.error('Error fetching company users:', error);
		const status = error?.status || 500;
		res.status(status).json({ error: error?.message || 'Failed to fetch users' });
	}
}
