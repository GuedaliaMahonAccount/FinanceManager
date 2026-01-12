import Settings from '../models/Settings.js';

// Get setting by key
export const getSetting = async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: req.params.key, user: req.user.id });
        if (!setting) {
            return res.status(404).json({ message: 'ההגדרה לא נמצאה' });
        }
        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת ההגדרה', error: error.message });
    }
};

// Get all settings
export const getAllSettings = async (req, res) => {
    try {
        const settings = await Settings.find({ user: req.user.id });
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });
        res.json(settingsObj);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת ההגדרות', error: error.message });
    }
};

// Update or create setting
export const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const setting = await Settings.findOneAndUpdate(
            { key, user: req.user.id },
            { key, value, user: req.user.id },
            { new: true, upsert: true }
        );

        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון ההגדרה', error: error.message });
    }
};

// Initialize default settings
export const initializeDefaultSettings = async (req, res) => {
    try {
        const count = await Settings.countDocuments({ user: req.user.id });

        if (count === 0) {
            await Settings.create({ key: 'displayCurrency', value: 'ILS', user: req.user.id });
            const settings = await Settings.find({ user: req.user.id });
            res.json({ message: 'הגדרות ברירת מחדל נוצרו', settings });
        } else {
            res.json({ message: 'הגדרות כבר קיימות' });
        }
    } catch (error) {
        res.status(500).json({ message: 'שגיאה ביצירת הגדרות ברירת מחדל', error: error.message });
    }
};
