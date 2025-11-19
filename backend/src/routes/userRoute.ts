import { Router } from 'express';
import { login, loginWithLine } from '../controllers/loginController';
import { register, registerCompany, registerCompanyPublic, registerPublic } from '../controllers/userController';

const router = Router();

router.post('/login', login);
router.post('/login/line', loginWithLine);
router.post('/register', register);
router.post('/register-company', registerCompany);
router.post('/public/company-register', registerCompanyPublic);
router.post('/public/register', registerPublic);

export default router;
