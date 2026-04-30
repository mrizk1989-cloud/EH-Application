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
    res.render('userHome');
});

// ================= REQUEST FORM =================
router.get('/request-form', verifyToken, (req, res) => {
    res.render('requestForm');
});

// ================= ADMIN =================
router.get('/admin', verifyToken, requireAdmin, (req, res) => {
    res.render('admin');
});

module.exports = router;