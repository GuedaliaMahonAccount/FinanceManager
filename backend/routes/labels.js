import express from 'express';
import {
    getAllLabels,
    getLabel,
    createLabel,
    updateLabel,
    deleteLabel,
    initializeDefaultLabels
} from '../controllers/labelController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllLabels);
router.get('/:id', getLabel);
router.post('/', createLabel);
router.post('/init', initializeDefaultLabels);
router.put('/:id', updateLabel);
router.delete('/:id', deleteLabel);

export default router;
