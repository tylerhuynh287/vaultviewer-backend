import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export default verifyToken;