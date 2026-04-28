if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');

const session = require('express-session');
const flash = require('connect-flash');

const User = require('./models/User');

const indexRouter = require('./routes/index');
const registerRouter = require('./routes/register');

// =======================
// VIEW ENGINE
// =======================
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// =======================
// MIDDLEWARE
// =======================
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// =======================
// SESSION + FLASH
// =======================
app.use(session({
    secret: 'mySecretKey123',
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

// Make flash messages available in ALL EJS files
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// =======================
// DB CONNECTION
// =======================
mongoose.connect(process.env.DATABASE_URL);

const db = mongoose.connection;
db.on('error', err => console.error('Mongo Error:', err));
db.once('open', () => console.log('Connected to MongoDB'));

// =======================
// ROUTES
// =======================
app.use('/', indexRouter);
app.use('/', registerRouter);

// =======================


// =======================
// START SERVER
// =======================
app.listen(process.env.PORT || 3000, () => {
    console.log('Server running...');
});