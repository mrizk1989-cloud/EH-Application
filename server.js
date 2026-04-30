require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const adminRoutes = require('./routes/admin');

const app = express();

// ================= SECURITY =================
app.use(helmet());

// ================= CORE =================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ================= SESSION (NEW AUTH SYSTEM) =================
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// ================= STATIC =================
app.use(express.static(path.join(__dirname, 'public')));

// ================= VIEW ENGINE =================
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('trust proxy', 1);

// ================= DB =================
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// ================= ROUTES =================
app.use('/', pageRoutes);
app.use('/api', authRoutes);
app.use('/admin', adminRoutes);

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
    console.error("🔥 FULL ERROR:", err);

    if (req.originalUrl.startsWith('/api')) {
        return res.status(500).json({
            success: false,
            message: err.message || "Server error"
        });
    }

    res.status(500).send("Page error: " + err.message);
});

// ================= START =================
app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});