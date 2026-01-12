import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
});

// Ensure keys are unique per user
settingsSchema.index({ key: 1, user: 1 }, { unique: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
