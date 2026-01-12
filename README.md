# Finance Manager - מנהל הכספים שלי

אפליקציית ווב מלאה לניהול פיננסי עם ממשק בעברית.

## תכונות

- ✅ ניהול פרויקטים מרובים
- ✅ מעקב הכנסות והוצאות
- ✅ תמיכה במטבעות מרובים (₪, $, €)
- ✅ המרת מטבעות אוטומטית
- ✅ העלאת קבלות וקבצים
- ✅ פילטרים וחיפוש
- ✅ ממשק בעברית עם RTL
- ✅ עיצוב מודרני וחדשני

## הרצת האפליקציה

### Frontend (React)
```bash
cd frontend
npm run dev
```
גש ל-http://localhost:5173

### Backend (Node.js + MongoDB)
```bash
cd backend
npm run dev
```
Backend רץ על http://localhost:4010

## דרישות

- Node.js 18+
- MongoDB (מקומי או MongoDB Atlas)
- משתנה סביבה `MONGO_URI` בקובץ `backend/.env`

## מבנה הפרויקט

```
FinanceManager/
├── frontend/           # React app
│   ├── src/
│   │   ├── components/ # קומפוננטים
│   │   ├── db/        # IndexedDB
│   │   ├── services/  # שירותים
│   │   └── styles/    # CSS
│   └── package.json
│
├── backend/           # Express API
│   ├── models/       # MongoDB models
│   ├── controllers/  # Business logic
│   ├── routes/       # API routes
│   ├── config/       # Configuration
│   └── server.js
│
└── README.md
```

## תיעוד

- [Walkthrough](../.gemini/antigravity/brain/ff606e01-18fe-489b-929a-757cb88f5ad2/walkthrough.md) - מדריך מלא
- [API Documentation](backend/API_DOCUMENTATION.md) - תיעוד API

## טכנולוגיות

**Frontend:**
- React 19
- Vite
- IndexedDB
- Vanilla CSS

**Backend:**
- Node.js
- Express 5
- MongoDB
- Mongoose

## רישיון

MIT