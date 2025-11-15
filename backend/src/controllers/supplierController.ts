import { Request, Response } from 'express';
import prisma from '../prisma';
import { getCompanyId, httpError } from '../utils/context';

function validateSupplierPayload(body: any) {
  if (!body.SupplierName) return 'SupplierName is required';
  if (!body.SupplierCode) return 'SupplierCode is required';
  return null;
}

export async function createSupplier(req: Request, res: Response) {
  try {
    const err = validateSupplierPayload(req.body);
    if (err) return res.status(400).json({ error: err });

    const CompanyId = getCompanyId(req, true)!;
    const { SupplierName, SupplierAddress, SupplierCode, SupplierTelNumber, CreatedBy } = req.body;

    const exists = await prisma.supplier.findFirst({ where: { SupplierCode, CompanyId } });
    if (exists) return res.status(409).json({ error: 'SupplierCode already exists' });

    const supplier = await prisma.supplier.create({
      data: { CompanyId, SupplierName, SupplierAddress, SupplierCode, SupplierTelNumber, CreatedBy },
    });
    return res.status(201).json(supplier);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2002') return res.status(409).json({ error: 'SupplierCode already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listSuppliers(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const suppliers = await prisma.supplier.findMany({ where: { CompanyId }, orderBy: { SupplierName: 'asc' } });
    return res.json(suppliers);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSupplier(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const supplier = await prisma.supplier.findFirst({ where: { SupplierId: id, CompanyId } });
    if (!supplier) return res.status(404).json({ error: 'Not found' });
    return res.json(supplier);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateSupplier(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { SupplierName, SupplierAddress, SupplierCode, SupplierTelNumber, UpdatedBy } = req.body;
    const data: any = {};
    if (SupplierName !== undefined) data.SupplierName = SupplierName;
    if (SupplierAddress !== undefined) data.SupplierAddress = SupplierAddress;
    if (SupplierCode !== undefined) data.SupplierCode = SupplierCode;
    if (SupplierTelNumber !== undefined) data.SupplierTelNumber = SupplierTelNumber;
    if (UpdatedBy !== undefined) data.UpdatedBy = UpdatedBy;

    const existed = await prisma.supplier.findFirst({ where: { SupplierId: id, CompanyId } });
    if (!existed) throw httpError(404, 'Not found');
    const supplier = await prisma.supplier.update({ where: { SupplierId: id }, data });
    return res.json(supplier);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    if (e.code === 'P2002') return res.status(409).json({ error: 'SupplierCode already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteSupplier(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const existed = await prisma.supplier.findFirst({ where: { SupplierId: id, CompanyId } });
    if (!existed) return res.status(404).json({ error: 'Not found' });
    await prisma.supplier.delete({ where: { SupplierId: id } });
    return res.status(204).send();
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
