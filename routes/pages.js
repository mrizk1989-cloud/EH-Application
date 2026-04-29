const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// public page
router.get('/', (req, res) => {
    res.render('index');
});

router.get('/user', verifyToken, (req, res) => {
    res.render('userHome');
});

router.get('/request-form', verifyToken, (req, res) => {
    res.render('requestForm', {
        csrfToken: req.csrfToken ? req.csrfToken() : ""
    });
});



module.exports = router;