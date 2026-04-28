import { Router } from 'express';
import { getTasks, getTaskById, createTaskFromSurvey, getAllTasks, verifyTask, deleteTask, acceptTask, completeTask } from '../controllers/taskController';
import { uploadCompletionImages } from '../utils/cloudinary';
import { auth, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', auth, getTasks);
router.get('/all', auth, authorize('NGO_ADMIN'), getAllTasks);
router.get('/:id', auth, getTaskById);
router.post('/create', auth, authorize('NGO_ADMIN'), createTaskFromSurvey);
router.put('/:id/verify', auth, authorize('NGO_ADMIN'), verifyTask);
router.delete('/:id', auth, authorize('NGO_ADMIN'), deleteTask);
router.put('/:id/accept', auth, authorize('VOLUNTEER'), acceptTask);
router.post('/:id/complete', auth, authorize('VOLUNTEER'), uploadCompletionImages.array('images', 5), completeTask);

export default router;
