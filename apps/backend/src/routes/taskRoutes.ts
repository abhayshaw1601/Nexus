import { Router } from 'express';
import { getTasks, createTaskFromSurvey, getAllTasks, verifyTask, deleteTask, acceptTask, completeTask } from '../controllers/taskController';
import { upload } from '../utils/multer';

import { auth, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', auth, getTasks);
router.get('/all', auth, authorize('NGO_ADMIN'), getAllTasks);
router.post('/create', auth, authorize('NGO_ADMIN'), createTaskFromSurvey);
router.put('/:id/verify', auth, authorize('NGO_ADMIN'), verifyTask);
router.delete('/:id', auth, authorize('NGO_ADMIN'), deleteTask);
router.put('/:id/accept', auth, authorize('VOLUNTEER'), acceptTask);
router.put('/:id/complete', auth, authorize('VOLUNTEER'), upload.single('file'), completeTask);

export default router;
