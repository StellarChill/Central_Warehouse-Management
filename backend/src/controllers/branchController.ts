import { Request, Response } from 'express';
import prisma from '../prisma';

function validateBranchPayload(body: any) {
  if (!body.BranchName) return 'BranchName is required';
  if (!body.BranchCode) return 'BranchCode is required';
  return null;
}

export async function createBranch(req: Request, res: Response) {
  try {
    const err = validateBranchPayload(req.body);
    if (err) return res.status(400).json({ error: err });

    const { BranchName, BranchAddress, BranchCode, CreatedBy } = req.body;
    const exists = await prisma.branch.findUnique({ where: { BranchCode } });
    if (exists) return res.status(409).json({ error: 'BranchCode already exists' });

    const branch = await prisma.branch.create({
      data: { BranchName, BranchAddress, BranchCode, CreatedBy },
    });
    return res.status(201).json(branch);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2002') return res.status(409).json({ error: 'BranchCode already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listBranches(req: Request, res: Response) {
  try {
    const branches = await prisma.branch.findMany({ orderBy: { BranchName: 'asc' } });
    return res.json(branches);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getBranch(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const branch = await prisma.branch.findUnique({ where: { BranchId: id } });
    if (!branch) return res.status(404).json({ error: 'Not found' });
    return res.json(branch);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateBranch(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { BranchName, BranchAddress, BranchCode, UpdatedBy } = req.body;
    const branch = await prisma.branch.update({
      where: { BranchId: id },
      data: { BranchName, BranchAddress, BranchCode, UpdatedBy },
    });
    return res.json(branch);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    if (e.code === 'P2002') return res.status(409).json({ error: 'BranchCode already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteBranch(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    await prisma.branch.delete({ where: { BranchId: id } });
    return res.status(204).send();
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
