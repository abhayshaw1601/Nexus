import { Router } from 'express';
import { submitDetails } from '../controllers/volunteerController';
import { auth } from '../middleware/authMiddleware';
import { uploadIdProof } from '../utils/cloudinary';

const router = Router();

router.post('/submit-details', auth, uploadIdProof.single('idProof'), submitDetails);

export default router;
