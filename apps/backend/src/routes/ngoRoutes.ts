import { Router } from 'express';
import { getPendingReports } from '../controllers/ngoController';
import { auth, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/pending-reports', auth, authorize('NGO_ADMIN'), getPendingReports);

export default router;
