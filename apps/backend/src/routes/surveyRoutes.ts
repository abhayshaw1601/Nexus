import { Router } from 'express';
import { uploadSurvey } from '../controllers/surveyController';
import { upload } from '../utils/multer';

const router = Router();

// In a real app, we'd add auth middleware here
router.post('/upload', upload.single('file'), uploadSurvey);

export default router;
