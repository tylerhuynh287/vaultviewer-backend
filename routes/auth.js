const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const verifyToken = require("../middleware/verifyToken");

router.get("/me", verifyToken, async (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});