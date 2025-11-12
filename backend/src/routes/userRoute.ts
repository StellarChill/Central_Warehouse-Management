import { Router } from 'express';
import { login, loginWithLine } from '../controllers/loginController';
import { register } from '../controllers/userController';

const router = Router();

router.post('/login', login);
router.post('/login/line', loginWithLine);
router.post('/register', register);

export default router;
