import Project from '../models/Project.js';

// Get all projects
export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת הפרויקטים', error: error.message });
    }
};

// Get single project
export const getProject = async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
        if (!project) {
            return res.status(404).json({ message: 'הפרויקט לא נמצא' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת הפרויקט', error: error.message });
    }
};

// Create project
export const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'שם הפרויקט נדרש' });
        }

        const project = new Project({
            name,
            description,
            user: req.user.id
        });

        const savedProject = await project.save();
        res.status(201).json(savedProject);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה ביצירת הפרויקט', error: error.message });
    }
};

// Update project
export const updateProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { name, description },
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({ message: 'הפרויקט לא נמצא' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון הפרויקט', error: error.message });
    }
};

// Delete project
export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user.id });

        if (!project) {
            return res.status(404).json({ message: 'הפרויקט לא נמצא' });
        }

        // Also delete all transactions related to this project
        const Transaction = (await import('../models/Transaction.js')).default;
        await Transaction.deleteMany({ projectId: req.params.id });

        res.json({ message: 'הפרויקט נמחק בהצלחה' });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה במחיקת הפרויקט', error: error.message });
    }
};
