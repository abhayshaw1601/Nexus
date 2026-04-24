import { Router } from 'express';
import { getTasks, createTaskFromSurvey, getAllTasks, verifyTask, deleteTask } from '../controllers/taskController';

const router = Router();

router.get('/', getTasks);
router.get('/all', getAllTasks);
router.post('/create', createTaskFromSurvey);
router.put('/:id/verify', verifyTask);
router.delete('/:id', deleteTask);

export default router;
