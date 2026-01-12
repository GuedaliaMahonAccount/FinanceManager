import express from 'express';
import {
    getAllLabels,
    getLabel,
    createLabel,
    updateLabel,
    deleteLabel,
    initializeDefaultLabels
} from '../controllers/labelController.js';

const router = express.Router();

router.get('/', getAllLabels);
router.get('/:id', getLabel);
router.post('/', createLabel);
router.post('/init', initializeDefaultLabels);
router.put('/:id', updateLabel);
router.delete('/:id', deleteLabel);

export default router;
