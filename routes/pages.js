const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// public page
router.get('/', (req, res) => {
    res.render('index');
});

// example protected page
router.get('/dashboard', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: "Welcome dashboard",
        user: req.user
    });
});

module.exports = router;