const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// public page
router.get('/', (req, res) => {
    res.render('index');
});

// // example protected page
// router.get('/dashboard', verifyToken, (req, res) => {
//     res.json({
//         success: true,
//         message: "Welcome dashboard",
//         user: req.user
//     });
// });

router.get('/user', (req, res) => {
    res.render('userHome');
});

router.get('/request-form', (req, res) => {
    res.render('requestForm', {
        csrfToken: req.csrfToken ? req.csrfToken() : ""
    });
});

module.exports = router;