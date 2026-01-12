import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'ILS'],
        default: 'ILS',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    frequencyValue: {
        type: Number,
        required: true,
        min: 1
    },
    frequencyUnit: {
        type: String,
        enum: ['days', 'weeks', 'months', 'years'],
        default: 'months',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
