import express, { Request, Response } from "express";
import admin from "firebase-admin";
import verifyToken from "../middleware/verifyToken";
import { ErrorCodes, GenericErrorMessages } from "../enums/errors";
import { BinCollections, BinErrorMessages, BinSuccessMessages } from "../Firebase/bin/binConstants";


interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}
interface BinUpdatePayload {
    name?: string;
    qrCode?: string;
    updatedAt?: FirebaseFirestore.FieldValue;
}

const router = express.Router();
const firestore = admin.firestore();

// Get all bins
router.get("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;

        if (!userId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: GenericErrorMessages.MISSING_USER_ID
            });
        }

        const binsRef = firestore.collection(BinCollections.USERS).doc(userId).collection("bins");
        const snapshot = await binsRef.get();
        
        // Changed to .map for conciseness
        const bins = snapshot.docs.map(doc => ({
            binId: doc.id,
            ...doc.data()
        }));
    
        res.json({ 
            success: true, 
            bins: [] 
        });
    } catch (error: any) {
        console.error(BinErrorMessages.GENERIC_BIN_ERROR, error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Create a new bin
router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { name, qrCode } = req.body;

        if (!userId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: GenericErrorMessages.MISSING_USER_ID
            });
        }

        const binsRef = firestore.collection(BinCollections.USERS).doc(userId).collection("bins");
        const newBinRef = binsRef.doc();

        await newBinRef.set({
            binId: newBinRef.id,
            name,
            qrCode,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    
        res.status(201).json({
            success: true,
            message: "Storage bin created!",
            binId: newBinRef.id
        });
    } catch (error: any) {
        console.error(BinErrorMessages.GENERIC_BIN_ERROR, error);
        res.status(500).json({
            success: false, 
            error: error.message 
        });
    }
});

// Get a specific bin
router.get("/:binId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { binId } = req.params;

        if (!userId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message:  GenericErrorMessages.MISSING_USER_ID
            });
        } else if(!binId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: BinErrorMessages.MISSING_BIN_ID
            });
        }

        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        if (!binDoc.exists) {
            return res.status(ErrorCodes.NOT_FOUND).json({ 
                success: false, 
                message: BinErrorMessages.MISSING_BIN
            });
        }
  
        res.json({ 
            success: true,
            bin: binDoc.data()
        });
    } catch (error: any) {
        console.error(BinErrorMessages.GENERIC_BIN_ERROR, error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Update a bin
router.put("/:binId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { binId } = req.params;
        const { name, qrCode } = req.body;

        if (!userId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message:  GenericErrorMessages.MISSING_USER_ID
            });
        } else if(!binId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: BinErrorMessages.MISSING_BIN_ID
            });
        }

        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        if (!binDoc.exists) {
            return res.status(ErrorCodes.NOT_FOUND).json({
                success: false,
                message: BinErrorMessages.MISSING_BIN
            });
        }
    
        const updatedFields: BinUpdatePayload = {};
        if (name) updatedFields.name = name;
        if (qrCode) updatedFields.qrCode = qrCode;
        updatedFields.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
        await binRef.update(updatedFields as FirebaseFirestore.UpdateData<BinUpdatePayload>);
    
        res.json({
            success: true,
            message: BinSuccessMessages.BIN_SUCCESS_UPDATE,
            updatedFields,
        });
    } catch (error: any) {
        console.error(BinErrorMessages.UPDATE_BIN_ERROR, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete a bin and all items in it
router.delete("/:binId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.uid;
    const { binId } = req.params;
    try {
        

        if (!userId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message:  GenericErrorMessages.MISSING_USER_ID
            });
        } else if(!binId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: BinErrorMessages.MISSING_BIN_ID
            });
        }

        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        if (!binDoc.exists) {
            return res.status(ErrorCodes.NOT_FOUND).json({
                success: false,
                message: BinErrorMessages.MISSING_BIN
            });
        }
    
        const itemsRef = binRef.collection("items");
        const itemsSnapshot = await itemsRef.get();
    
        const deleteItemsPromises = itemsSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deleteItemsPromises);
    
        await binRef.delete();
    
        res.json({
            success: true,
            message: BinSuccessMessages.BIN_SUCCESS_DELETE
        });
    } catch (error: any) {
        console.error(`${BinErrorMessages.DELETE_BIN_ERROR}: ${binId}`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
  
export default router;