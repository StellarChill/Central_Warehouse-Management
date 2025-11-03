import { Request, Response } from 'express';
import prisma from '../prisma';

function validateSupplierPayload(body: any) {
  if (!body.SupplierName) return 'SupplierName is required';
  if (!body.SupplierCode) return 'SupplierCode is required';
  return null;
}

export async function createSupplier(req: Request, res: Response) {
  try {
    const err = validateSupplierPayload(req.body);
    if (err) return res.status(400).json({ error: err });

    const { SupplierName, SupplierAddress, SupplierCode, SupplierTelNumber, CreatedBy } = req.body;

    const exists = await prisma.supplier.findUnique({ where: { SupplierCode } });
    if (exists) return res.status(409).json({ error: 'SupplierCode already exists' });

    const supplier = await prisma.supplier.create({
      data: { SupplierName, SupplierAddress, SupplierCode, SupplierTelNumber, CreatedBy },
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
    const suppliers = await prisma.supplier.findMany({ orderBy: { SupplierName: 'asc' } });
    return res.json(suppliers);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSupplier(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const supplier = await prisma.supplier.findUnique({ where: { SupplierId: id } });
    if (!supplier) return res.status(404).json({ error: 'Not found' });
    return res.json(supplier);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateSupplier(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { SupplierName, SupplierAddress, SupplierCode, SupplierTelNumber, UpdatedBy } = req.body;
    const data: any = {};
    if (SupplierName !== undefined) data.SupplierName = SupplierName;
    if (SupplierAddress !== undefined) data.SupplierAddress = SupplierAddress;
    if (SupplierCode !== undefined) data.SupplierCode = SupplierCode;
    if (SupplierTelNumber !== undefined) data.SupplierTelNumber = SupplierTelNumber;
    if (UpdatedBy !== undefined) data.UpdatedBy = UpdatedBy;

    const supplier = await prisma.supplier.update({
      where: { SupplierId: id },
      data,
    });
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
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    await prisma.supplier.delete({ where: { SupplierId: id } });
    return res.status(204).send();
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
