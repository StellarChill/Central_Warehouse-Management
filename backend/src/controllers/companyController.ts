import { Request, Response } from 'express';
import prisma from '../prisma';

function validateCompanyPayload(body: any) {
  if (!body.CompanyName) return 'CompanyName is required';
  if (!body.CompanyCode) return 'CompanyCode is required';
  return null;
}

export async function createCompany(req: Request, res: Response) {
  try {
    const err = validateCompanyPayload(req.body);
    if (err) return res.status(400).json({ error: err });
    const { CompanyName, CompanyAddress, TaxId, CompanyCode, CompanyTelNumber, CompanyEmail, CreatedBy } = req.body;
    const exists = await prisma.company.findUnique({ where: { CompanyCode } });
    if (exists) return res.status(409).json({ error: 'CompanyCode already exists' });
    const row = await prisma.company.create({
      data: { CompanyName, CompanyAddress, TaxId, CompanyCode, CompanyTelNumber, CompanyEmail, CreatedBy },
    });
    return res.status(201).json(row);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2002') return res.status(409).json({ error: 'CompanyCode already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listCompanies(_req: Request, res: Response) {
  try {
    const rows = await prisma.company.findMany({ orderBy: { CompanyName: 'asc' } });
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCompany(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const row = await prisma.company.findUnique({ where: { CompanyId: id } });
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.json(row);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCompany(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const { CompanyName, CompanyAddress, TaxId, CompanyCode, CompanyTelNumber, CompanyEmail, UpdatedBy } = req.body;
    const data: any = {};
    if (CompanyName !== undefined) data.CompanyName = CompanyName;
    if (CompanyAddress !== undefined) data.CompanyAddress = CompanyAddress;
    if (TaxId !== undefined) data.TaxId = TaxId;
    if (CompanyCode !== undefined) data.CompanyCode = CompanyCode;
    if (CompanyTelNumber !== undefined) data.CompanyTelNumber = CompanyTelNumber;
    if (CompanyEmail !== undefined) data.CompanyEmail = CompanyEmail;
    if (UpdatedBy !== undefined) data.UpdatedBy = UpdatedBy;
    const row = await prisma.company.update({ where: { CompanyId: id }, data });
    return res.json(row);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2002') return res.status(409).json({ error: 'CompanyCode already exists' });
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteCompany(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    await prisma.company.delete({ where: { CompanyId: id } });
    return res.status(204).send();
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default {};
