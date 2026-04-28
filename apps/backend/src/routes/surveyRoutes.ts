import { Router } from 'express';
import {
  uploadSurvey,
  uploadSurveyImage,
  saveDraft,
  submitSurvey,
  getPendingSurveys,
  verifySurvey,
  getMySurveys,
  getSurveyById
} from '../controllers/surveyController';
import { upload } from '../utils/multer';
import { auth, authorize } from '../middleware/authMiddleware';

const router = Router();

// Field Worker & Admin routes
router.get('/my-surveys', auth, authorize('FIELD_WORKER', 'NGO_ADMIN', 'SUPER_ADMIN'), getMySurveys);
router.post('/upload-image', auth, authorize('FIELD_WORKER', 'NGO_ADMIN', 'SUPER_ADMIN'), upload.single('image'), uploadSurveyImage);
router.post('/save-draft', auth, authorize('FIELD_WORKER', 'NGO_ADMIN', 'SUPER_ADMIN'), saveDraft);
router.post('/submit', auth, authorize('FIELD_WORKER', 'NGO_ADMIN', 'SUPER_ADMIN'), submitSurvey);
router.post('/upload', auth, authorize('FIELD_WORKER', 'NGO_ADMIN', 'SUPER_ADMIN'), upload.single('file'), uploadSurvey);

// NGO Admin routes
router.get('/pending', auth, authorize('NGO_ADMIN'), getPendingSurveys);
router.get('/:id', auth, getSurveyById);
router.post('/verify', auth, authorize('NGO_ADMIN'), verifySurvey);

export default router;
