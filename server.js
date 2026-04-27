if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config(); 
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');

const indexRouter = require('./routes/index');

// View engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// (Optional) Layouts
// app.use(expressLayouts);
// app.set('layout', 'layouts/layout');

// MongoDB connection
mongoose.connect(process.env.DATABASE_URL);

const db = mongoose.connection;
db.on('error', error => console.error(error));
db.once('open', () => console.log('Connected to MongoDB'));

app.use(express.urlencoded({ extended: false }));


app.use('/', indexRouter)


app.get('/login', (req,res) => {
    res.render('login.ejs')
})

app.get('/register', (req,res) => {
    res.render('register.ejs')
})

// app.post('/login', passport.authenticate('local',{
//     successRedirect: '/login',
//     failureRedirect: '/',
//     failureFlash: true
// }))

app.post('/register', async(req,res) => {
    try {
        const hashedPassword = await bycrypt.hash(req.body.password,10)
        users.push({
            id: Date.now().toString(),
            name: req.body.fullName,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/register')
    } catch {
        res.redirect('/')
    }
    console.log(users)
})

app.listen(process.env.PORT || 3000)