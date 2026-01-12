import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
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
        required: true,
        default: 'ILS'
    },
    date: {
        type: Date,
        required: true
    },
    labelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Label'
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    receipts: [{
        name: { type: String, required: true },
        type: { type: String, required: true },
        size: { type: Number, required: true },
        data: { type: String, required: true } // base64 encoded file
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
transactionSchema.index({ projectId: 1, date: -1 });
transactionSchema.index({ type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
