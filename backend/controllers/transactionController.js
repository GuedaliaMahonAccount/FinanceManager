import Transaction from '../models/Transaction.js';

// Get all transactions
export const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('labelId')
            .sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת התנועות', error: error.message });
    }
};

// Get transactions by project
export const getTransactionsByProject = async (req, res) => {
    try {
        const transactions = await Transaction.find({ projectId: req.params.projectId })
            .populate('labelId')
            .sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת התנועות', error: error.message });
    }
};

// Get single transaction
export const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id).populate('labelId');
        if (!transaction) {
            return res.status(404).json({ message: 'התנועה לא נמצאה' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת התנועה', error: error.message });
    }
};

// Create transaction
export const createTransaction = async (req, res) => {
    try {
        const {
            projectId,
            type,
            name,
            description,
            amount,
            currency,
            date,
            labelId,
            receipts
        } = req.body;

        console.log('Creating transaction:', { projectId, type, name, amount, date, currency, labelId });

        // Validation
        if (!projectId || !type || !name || !amount || !date) {
            return res.status(400).json({ message: 'שדות חובה חסרים' });
        }

        const transaction = new Transaction({
            projectId,
            type,
            name,
            description,
            amount,
            currency: currency || 'ILS',
            date: new Date(date), // Convert timestamp to Date object
            labelId,
            receipts: receipts || []
        });

        const savedTransaction = await transaction.save();
        const populatedTransaction = await Transaction.findById(savedTransaction._id).populate('labelId');

        res.status(201).json(populatedTransaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'שגיאה ביצירת התנועה', error: error.message });
    }
};

// Update transaction
export const updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('labelId');

        if (!transaction) {
            return res.status(404).json({ message: 'התנועה לא נמצאה' });
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון התנועה', error: error.message });
    }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndDelete(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'התנועה לא נמצאה' });
        }

        res.json({ message: 'התנועה נמחקה בהצלחה' });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה במחיקת התנועה', error: error.message });
    }
};

// Get transaction statistics by project
export const getProjectStats = async (req, res) => {
    try {
        const { projectId } = req.params;

        const stats = await Transaction.aggregate([
            { $match: { projectId: mongoose.Types.ObjectId(projectId) } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {
            income: 0,
            expenses: 0,
            total: 0,
            transactionCount: 0
        };

        stats.forEach(stat => {
            if (stat._id === 'income') {
                result.income = stat.total;
                result.transactionCount += stat.count;
            } else if (stat._id === 'expense') {
                result.expenses = stat.total;
                result.transactionCount += stat.count;
            }
        });

        result.total = result.income - result.expenses;

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בחישוב הסטטיסטיקות', error: error.message });
    }
};
