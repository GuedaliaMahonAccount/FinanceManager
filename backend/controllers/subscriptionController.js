import Subscription from '../models/Subscription.js';

// Get subscriptions by project
export const getSubscriptionsByProject = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ projectId: req.params.projectId }).sort({ startDate: 1 });
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת המנויים', error: error.message });
    }
};

// Create subscription
export const createSubscription = async (req, res) => {
    try {
        const { projectId, name, description, amount, currency, startDate, frequencyValue, frequencyUnit } = req.body;

        if (!projectId || !name || !amount || !startDate || !frequencyValue || !frequencyUnit) {
            return res.status(400).json({ message: 'חסרים שדות חובה' });
        }

        const subscription = new Subscription({
            projectId,
            name,
            description,
            amount: Number(amount),
            currency,
            startDate: new Date(startDate),
            frequencyValue: Number(frequencyValue),
            frequencyUnit
        });

        const savedSubscription = await subscription.save();
        res.status(201).json(savedSubscription);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה ביצירת המנוי', error: error.message });
    }
};

// Update subscription
export const updateSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!subscription) {
            return res.status(404).json({ message: 'המנוי לא נמצא' });
        }

        res.json(subscription);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון המנוי', error: error.message });
    }
};

// Delete subscription
export const deleteSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findByIdAndDelete(req.params.id);

        if (!subscription) {
            return res.status(404).json({ message: 'המנוי לא נמצא' });
        }

        res.json({ message: 'המנוי נמחק בהצלחה' });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה במחיקת המנוי', error: error.message });
    }
};
