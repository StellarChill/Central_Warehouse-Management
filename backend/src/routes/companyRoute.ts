import { Router } from 'express';
import { createCompany, listCompanies, getCompany, updateCompany, deleteCompany } from '../controllers/companyController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();

// Protect all company management routes; only PLATFORM_ADMIN
router.use(authenticateToken, requireRoles('PLATFORM_ADMIN'));

router.post('/', createCompany);
router.get('/', listCompanies);
router.get('/:id', getCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
