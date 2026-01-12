import express from 'express';
import {
    getAllTransactions,
    getTransactionsByProject,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getProjectStats
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllTransactions);
router.get('/project/:projectId', getTransactionsByProject);
router.get('/stats/:projectId', getProjectStats);
router.get('/:id', getTransaction);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
