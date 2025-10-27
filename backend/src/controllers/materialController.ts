import { Request, Response } from 'express';
import prisma from '../prisma';

function validateMaterialPayload(body: any) {
  if (!body.MaterialName) return 'MaterialName is required';
  if (!body.Unit) return 'Unit is required';
  if (body.Price === undefined || body.Price === null || isNaN(Number(body.Price))) return 'Price is required and must be a number';
  if (!body.CatagoryId) return 'CatagoryId is required';
  if (!body.MaterialCode) return 'MaterialCode is required';
  return null;
}

export async function createMaterial(req: Request, res: Response) {
  try {
    const err = validateMaterialPayload(req.body);
    if (err) return res.status(400).json({ error: err });

    const { MaterialName, Unit, Price, CatagoryId, MaterialCode, CreatedBy } = req.body;

    const exists = await prisma.material.findUnique({ where: { MaterialCode } });
    if (exists) return res.status(409).json({ error: 'MaterialCode already exists' });

    const material = await prisma.material.create({
      data: { MaterialName, Unit, Price: Number(Price), CatagoryId: Number(CatagoryId), MaterialCode, CreatedBy },
    });
    return res.status(201).json(material);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2002') return res.status(409).json({ error: 'MaterialCode already exists' });
    if (e.code === 'P2003') return res.status(400).json({ error: 'Invalid CatagoryId (FK constraint)' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listMaterials(req: Request, res: Response) {
  try {
    const materials = await prisma.material.findMany({ orderBy: { MaterialName: 'asc' } });
    return res.json(materials);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMaterial(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const material = await prisma.material.findUnique({ where: { MaterialId: id } });
    if (!material) return res.status(404).json({ error: 'Not found' });
    return res.json(material);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateMaterial(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { MaterialName, Unit, Price, CatagoryId, MaterialCode, UpdatedBy } = req.body;

    const data: any = {};
    if (MaterialName !== undefined) data.MaterialName = MaterialName;
    if (Unit !== undefined) data.Unit = Unit;
    if (Price !== undefined) data.Price = Number(Price);
    if (CatagoryId !== undefined) data.CatagoryId = Number(CatagoryId);
    if (MaterialCode !== undefined) data.MaterialCode = MaterialCode;
    if (UpdatedBy !== undefined) data.UpdatedBy = UpdatedBy;

    const material = await prisma.material.update({
      where: { MaterialId: id },
      data,
    });
    return res.json(material);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    if (e.code === 'P2002') return res.status(409).json({ error: 'MaterialCode already exists' });
    if (e.code === 'P2003') return res.status(400).json({ error: 'Invalid CatagoryId (FK constraint)' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteMaterial(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    await prisma.material.delete({ where: { MaterialId: id } });
    return res.status(204).send();
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
