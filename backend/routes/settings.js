import express from 'express';
import {
    getSetting,
    getAllSettings,
    updateSetting,
    initializeDefaultSettings
} from '../controllers/settingsController.js';

const router = express.Router();

router.get('/', getAllSettings);
router.get('/:key', getSetting);
router.put('/:key', updateSetting);
router.post('/init', initializeDefaultSettings);

export default router;
