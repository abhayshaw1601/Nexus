import { Router } from 'express';
import { getTasks, createTaskFromSurvey } from '../controllers/taskController';

const router = Router();

router.get('/', getTasks);
router.post('/create', createTaskFromSurvey);

export default router;
