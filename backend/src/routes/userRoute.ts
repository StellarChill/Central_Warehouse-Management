import { Router } from 'express';
import { login, loginWithLine } from '../controllers/loginController';
import { register, registerCompany, registerCompanyPublic } from '../controllers/userController';

const router = Router();

router.post('/login', login);
router.post('/login/line', loginWithLine);
router.post('/register', register);
router.post('/register-company', registerCompany);
router.post('/public/company-register', registerCompanyPublic);

export default router;
