import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from './config/db.js';

// Import routes
import projectRoutes from './routes/projects.js';
import transactionRoutes from './routes/transactions.js';
import labelRoutes from './routes/labels.js';
import settingsRoutes from './routes/settings.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';

const app = express();

// 1. Connect to MongoDB
connectDB();

// 2. Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 3. Routes
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend is running" });
});

app.use('/api/projects', projectRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// 4. Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'שגיאה בשרת',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 5. Start server
const PORT = process.env.PORT || 4010;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
