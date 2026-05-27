import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignment,
  getQuestionPaper,
  deleteAssignment,
  regeneratePaper,
} from '../controllers/assignmentController';

const router = Router();

// Assignment CRUD
router.post('/', createAssignment);
router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.delete('/:id', deleteAssignment);

// Question Paper
router.get('/:assignmentId/paper', getQuestionPaper);
router.post('/:assignmentId/regenerate', regeneratePaper);

export default router;
