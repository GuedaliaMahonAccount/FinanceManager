import express from 'express';
import {
    getSetting,
    getAllSettings,
    updateSetting,
    initializeDefaultSettings
} from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllSettings);
router.get('/:key', getSetting);
router.put('/:key', updateSetting);
router.post('/init', initializeDefaultSettings);

export default router;
