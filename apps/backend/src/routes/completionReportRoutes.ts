import { Router } from 'express';
import { getPendingReports, getAllReports, getMyReports, verifyReport } from '../controllers/completionReportController';
import { auth, authorize } from '../middleware/authMiddleware';

const router = Router();

// Volunteer route - get own reports
router.get('/my', auth, getMyReports);

// NGO Admin routes
router.get('/pending', auth, authorize('NGO_ADMIN', 'SUPER_ADMIN'), getPendingReports);
router.get('/all', auth, authorize('NGO_ADMIN', 'SUPER_ADMIN'), getAllReports);
router.post('/:id/verify', auth, authorize('NGO_ADMIN', 'SUPER_ADMIN'), verifyReport);

export default router;
