import { Router } from 'express';
import { createCompany, listCompanies, getCompany, updateCompany, deleteCompany } from '../controllers/companyController';

const router = Router();

router.post('/', createCompany);
router.get('/', listCompanies);
router.get('/:id', getCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
