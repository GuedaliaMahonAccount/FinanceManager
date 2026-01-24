import express from 'express';
import {
    getSubscriptionsByProject,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    skipPayment
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/project/:projectId', getSubscriptionsByProject);
router.post('/', createSubscription);
router.put('/:id', updateSubscription);
router.post('/:id/skip', skipPayment);
router.delete('/:id', deleteSubscription);

export default router;
