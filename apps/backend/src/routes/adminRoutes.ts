import { Router } from 'express';
import { getPendingVolunteers, updateVolunteerStatus } from '../controllers/adminController';
import { auth, authorize } from '../middleware/authMiddleware';

const router = Router();

// Only NGO Admins and Super Admins can access these routes
router.use(auth);
router.use(authorize('NGO_ADMIN', 'SUPER_ADMIN'));

router.get('/volunteers/pending', getPendingVolunteers);
router.put('/volunteers/:id/verify', updateVolunteerStatus);

export default router;
