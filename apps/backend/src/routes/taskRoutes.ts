import { Router } from 'express';
import { getTasks, createTaskFromSurvey, getAllTasks, verifyTask, deleteTask, acceptTask, completeTask } from '../controllers/taskController';
import { upload } from '../utils/multer';

const router = Router();

router.get('/', getTasks);
router.get('/all', getAllTasks);
router.post('/create', createTaskFromSurvey);
router.put('/:id/verify', verifyTask);
router.delete('/:id', deleteTask);
router.put('/:id/accept', acceptTask);
router.put('/:id/complete', upload.single('file'), completeTask);

export default router;
