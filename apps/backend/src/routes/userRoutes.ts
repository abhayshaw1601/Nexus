import { Router } from 'express';
import { getUsers } from '../controllers/userController';
import { auth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', auth, getUsers);

export default router;
