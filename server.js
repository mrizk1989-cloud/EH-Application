

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');

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

// ================= ERROR HANDLER (MUST BE LAST) =================
// app.use((err, req, res, next) => {
//     console.error("🔥 ERROR:", err);

//     res.status(500).json({
//         success: false,
//         message: "Server error"
//     });
// });

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