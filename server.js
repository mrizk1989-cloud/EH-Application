require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const session = require('express-session');

const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');

const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const adminRoutes = require('./routes/admin');
const refreshRoutes = require('./routes/refresh');
const requestRoutes = require('./routes/requests');

const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ✅ MUST BE BEFORE SESSION
app.set('trust proxy', 1);

// ================= SECURITY =================
app.use(helmet());

// ================= CORE =================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ================= REDIS =================
const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('connect', () => console.log('Redis Connected'));
redisClient.on('error', (err) => console.error('Redis Error:', err.message));

(async () => {
    await redisClient.connect();
})();

// ================= SESSION =================
app.use(session({
    store: new RedisStore({
        client: redisClient,
        prefix: "sess:"
    }),
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    rolling: true, // ✅ IMPORTANT
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // ✅ FIX
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// ================= LIMIT =================
app.use(apiLimiter);

// ================= STATIC =================
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

// ================= VIEW =================
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// ================= DB =================
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// ================= ROUTES =================
app.use('/', pageRoutes);
app.use('/api', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/refresh', refreshRoutes);
app.use('/api/request', requestRoutes);

// ================= ERROR =================
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