const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

// ================= PUBLIC =================
router.get('/', (req, res) => {
    res.render('index');
});

// ================= USER =================
router.get('/user', verifyToken, (req, res) => {
    const csrfToken = req.cookies.csrf_token || null;

    res.render('userHome', {
        csrfToken
    });
});

// ================= REQUEST FORM =================
router.get('/request-form', verifyToken, (req, res) => {
    const csrfToken = req.cookies.csrf_token || null;

    res.render('requestForm', {
        csrfToken
    });
});

// ================= ADMIN =================
router.get('/admin', verifyToken, requireAdmin, (req, res) => {
    const csrfToken = req.cookies.csrf_token || null;

    res.render('admin', {
        csrfToken
    });
});

module.exports = router;