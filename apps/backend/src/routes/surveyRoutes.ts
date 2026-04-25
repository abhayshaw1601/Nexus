import { Router } from 'express';
import { 
  uploadSurvey, 
  saveDraft, 
  submitSurvey, 
  getPendingSurveys, 
  verifySurvey 
} from '../controllers/surveyController';
import { upload } from '../utils/multer';
import { auth, authorize } from '../middleware/authMiddleware';

const router = Router();

// Field Worker routes
router.post('/save-draft', auth, authorize('FIELD_WORKER'), saveDraft);
router.post('/submit', auth, authorize('FIELD_WORKER'), submitSurvey);
router.post('/upload', auth, authorize('FIELD_WORKER'), upload.single('file'), uploadSurvey);

// NGO Admin routes
router.get('/pending', auth, authorize('NGO_ADMIN'), getPendingSurveys);
router.post('/verify', auth, authorize('NGO_ADMIN'), verifySurvey);

export default router;
