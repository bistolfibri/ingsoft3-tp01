import { Router } from 'express';
import {
  getDashboardData,
  createExpense,
  payExpense,
  deleteExpense,
  updateBudget
} from '../controllers/expenseController.js';

const router = Router();

router.get('/dashboard', getDashboardData);
router.post('/expenses', createExpense);
router.post('/expenses/:id/pay', payExpense);
router.delete('/expenses/:id', deleteExpense);
router.put('/budget', updateBudget);

export default router;
