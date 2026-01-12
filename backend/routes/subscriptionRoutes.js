import express from 'express';
import {
    getSubscriptionsByProject,
    createSubscription,
    updateSubscription,
    deleteSubscription
} from '../controllers/subscriptionController.js';

const router = express.Router();

router.get('/project/:projectId', getSubscriptionsByProject);
router.post('/', createSubscription);
router.put('/:id', updateSubscription);
router.delete('/:id', deleteSubscription);

export default router;
