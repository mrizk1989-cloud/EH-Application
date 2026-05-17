const express = require("express");

const router = express.Router();

const Policy = require("../models/Policy");

const {
    verifyToken
} = require("../middleware/auth");

router.get(
    "/all",
    verifyToken,

    async (req, res) => { 

        try {

            const data = await Policy.find()
                .sort({ createdAt: -1 })
                .lean();

            res.json({
                success: true,
                data
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                message: "Failed to load policies"
            });
        }
    }
);

module.exports = router;