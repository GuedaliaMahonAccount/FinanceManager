import Label from '../models/Label.js';

// Get all labels
export const getAllLabels = async (req, res) => {
    try {
        const labels = await Label.find().sort({ createdAt: -1 });
        res.json(labels);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת התוויות', error: error.message });
    }
};

// Get single label
export const getLabel = async (req, res) => {
    try {
        const label = await Label.findById(req.params.id);
        if (!label) {
            return res.status(404).json({ message: 'התווית לא נמצאה' });
        }
        res.json(label);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת התווית', error: error.message });
    }
};

// Create label
export const createLabel = async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'שם התווית נדרש' });
        }

        const label = new Label({
            name,
            color: color || '#6366f1'
        });

        const savedLabel = await label.save();
        res.status(201).json(savedLabel);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה ביצירת התווית', error: error.message });
    }
};

// Update label
export const updateLabel = async (req, res) => {
    try {
        const { name, color } = req.body;

        const label = await Label.findByIdAndUpdate(
            req.params.id,
            { name, color },
            { new: true, runValidators: true }
        );

        if (!label) {
            return res.status(404).json({ message: 'התווית לא נמצאה' });
        }

        res.json(label);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון התווית', error: error.message });
    }
};

// Delete label
export const deleteLabel = async (req, res) => {
    try {
        const label = await Label.findByIdAndDelete(req.params.id);

        if (!label) {
            return res.status(404).json({ message: 'התווית לא נמצאה' });
        }

        res.json({ message: 'התווית נמחקה בהצלחה' });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה במחיקת התווית', error: error.message });
    }
};

// Initialize default labels
export const initializeDefaultLabels = async (req, res) => {
    try {
        const count = await Label.countDocuments();

        if (count === 0) {
            const defaultLabels = [
                { name: 'אוכל', color: '#f59e0b' },
                { name: 'תחבורה', color: '#3b82f6' },
                { name: 'קניות', color: '#8b5cf6' },
                { name: 'משכורת', color: '#10b981' },
                { name: 'אחר', color: '#6b7280' }
            ];

            await Label.insertMany(defaultLabels);
            const labels = await Label.find();
            res.json({ message: 'תוויות ברירת מחדל נוצרו', labels });
        } else {
            res.json({ message: 'תוויות כבר קיימות' });
        }
    } catch (error) {
        res.status(500).json({ message: 'שגיאה ביצירת תוויות ברירת מחדל', error: error.message });
    }
};
