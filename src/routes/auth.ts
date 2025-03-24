import express, { Request, Response } from "express";
import admin from "firebase-admin";
import verifyToken from "../middleware/verifyToken";

interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

const router = express.Router();

router.get("/me", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            user
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;