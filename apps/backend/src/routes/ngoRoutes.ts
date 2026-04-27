import { Router } from 'express';
import { getPendingReports, registerNGO, getMyNGO, updateNGO } from '../controllers/ngoController';
import { auth, authorize } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', auth, registerNGO);
router.get('/my-ngo', auth, getMyNGO);
router.put('/update', auth, updateNGO);
router.get('/pending-reports', auth, authorize('NGO_ADMIN'), getPendingReports);

export default router;
