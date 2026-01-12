import mongoose from 'mongoose';

const labelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        required: true,
        default: '#6366f1'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Label = mongoose.model('Label', labelSchema);

export default Label;
