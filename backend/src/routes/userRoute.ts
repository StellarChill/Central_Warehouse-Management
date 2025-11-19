import { Router } from 'express';
import { login, loginWithLine } from '../controllers/loginController';
import { register, registerCompany, registerCompanyPublic, registerPublic, getAllUsers, getCompanyUsers } from '../controllers/userController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/login/line', loginWithLine);
router.post('/register', register);
router.post('/register-company', registerCompany);
router.post('/public/company-register', registerCompanyPublic);
router.post('/public/register', registerPublic);
router.get('/users', getAllUsers);
// Company-scoped list (requires auth). PLATFORM_ADMIN can pass ?companyId= or header x-company-id to view another company.
router.get('/users/company', authenticateToken, getCompanyUsers);

export default router;
