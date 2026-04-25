import { Router } from 'express';
import { saveDraft, submitReport } from '../controllers/workerController';
import { auth, authorize } from '../middleware/authMiddleware';

const router = Router();

router.post('/save-draft', auth, authorize('FIELD_WORKER'), saveDraft);
router.post('/submit', auth, authorize('FIELD_WORKER'), submitReport);

export default router;
