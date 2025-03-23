const admin = require("firebase-admin");

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided"
        });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false, 
            message: "Unauthorized: Invalid token"
        });
    }
};

module.exports = verifyToken;