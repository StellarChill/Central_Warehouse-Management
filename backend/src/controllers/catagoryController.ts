import { Request, Response } from 'express';
import prisma from '../prisma';
import { getCompanyId, httpError } from '../utils/context';

// Simple validation helper
function validateCatagoryPayload(body: any) {
  if (!body.CatagoryName) return 'CatagoryName is required';
  if (!body.CatagoryCode) return 'CatagoryCode is required';
  return null;
}

export async function createCatagory(req: Request, res: Response) {
  try {
    const err = validateCatagoryPayload(req.body);
    if (err) return res.status(400).json({ error: err });

    const CompanyId = getCompanyId(req, true)!;
    const { CatagoryName, CatagoryCode, CreatedBy } = req.body;
    const exists = await prisma.catagory.findFirst({ where: { CatagoryCode, CompanyId } });
    if (exists) return res.status(409).json({ error: 'CatagoryCode already exists' });

    const cat = await prisma.catagory.create({
      data: { CompanyId, CatagoryName, CatagoryCode, CreatedBy },
    });
    return res.status(201).json(cat);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listCatagories(req: Request, res: Response) {
  try {
  const CompanyId = getCompanyId(req, true)!;
  const cat = await prisma.catagory.findMany({ where: { CompanyId }, orderBy: { CatagoryName: 'asc' } });
  return res.json(cat);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCatagory(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const cat = await prisma.catagory.findFirst({ where: { CatagoryId: id, CompanyId } });
  if (!cat) return res.status(404).json({ error: 'Not found' });
  return res.json(cat);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCatagory(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { CatagoryName, CatagoryCode, UpdatedBy } = req.body;
    const existed = await prisma.catagory.findFirst({ where: { CatagoryId: id, CompanyId } });
    if (!existed) throw httpError(404, 'Not found');
    const cat = await prisma.catagory.update({ where: { CatagoryId: id }, data: { CatagoryName, CatagoryCode, UpdatedBy } });
    return res.json(cat);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteCatagory(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const existed = await prisma.catagory.findFirst({ where: { CatagoryId: id, CompanyId } });
    if (!existed) return res.status(404).json({ error: 'Not found' });
    await prisma.catagory.delete({ where: { CatagoryId: id } });
    return res.status(204).send();
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
