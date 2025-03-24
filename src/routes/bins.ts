import express, { Request, Response } from "express";
import admin from "firebase-admin";
import verifyToken from "../middleware/verifyToken";
import { ErrorCodes, GenericErrorMessages } from "../enums/errors";
import { BinCollections, BinErrorMessages, BinSuccessMessages } from "../Firebase/bin/binConstants";


interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

const router = express.Router();


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

        const firestore = admin.firestore();
        const binsRef = firestore.collection(BinCollections.USERS).doc(userId).collection("bins");
        const snapshot = await binsRef.get();
    
        // TODO: Empty Bin is not an error just an empty query. Need to send back empty Array
        if (snapshot.empty) {
            return res.status(404).json({ 
                success: false, 
                message: BinErrorMessages.MISSING_BINS 
            });
        }
        
        // Changed to .map for conciseness
        const bins = snapshot.docs.map(doc => ({
            binId: doc.id,
            ...doc.data()
        }));
    
        res.json({ 
            success: true, 
            bins 
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
            return res.status(400).json({
                success: false,
                message: GenericErrorMessages.MISSING_USER_ID
            });
        }

        const firestore = admin.firestore();
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
        console.error("Error creating bin:", error);
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
            return res.status(400).json({
                success: false,
                message:  GenericErrorMessages.MISSING_USER_ID
            });
        } else if(!!binId) {
            return res.status(400).json({
                success: false,
                message: BinErrorMessages.MISSING_BINS
            });
        }

        const firestore = admin.firestore();
        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        // TODO: No Bin found shouldn't be an error - send back empty array
        if (!binDoc.exists) {
            return res.status(404).json({ 
                success: false, 
                message: BinErrorMessages.MISSING_BINS
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
            return res.status(400).json({
                success: false,
                message:  GenericErrorMessages.MISSING_USER_ID
            });
        } else if(!!binId) {
            return res.status(400).json({
                success: false,
                message: BinErrorMessages.MISSING_BINS
            });
        }

        const firestore = admin.firestore();
        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        // TODO: No Bin found shouldn't be an error - send back empty array
        if (!binDoc.exists) {
            return res.status(404).json({
                success: false,
                message: BinErrorMessages.MISSING_BINS
            });
        }
    
        const updatedFields: Record<string, any> = {};
        if (name) updatedFields.name = name;
        if (qrCode) updatedFields.qrCode = qrCode;
        updatedFields.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
        await binRef.update(updatedFields);
    
        res.json({
            success: true,
            message: BinSuccessMessages.BIN_SUCCESS_UPDATE,
            updatedFields,
        });
    } catch (error: any) {
        console.error(BinErrorMessages, error);
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
            return res.status(400).json({
                success: false,
                message:  GenericErrorMessages.MISSING_USER_ID
            });
        } else if(!!binId) {
            return res.status(400).json({
                success: false,
                message: BinErrorMessages.MISSING_BINS
            });
        }

        const firestore = admin.firestore();
        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        //TODO: Empty Bin is okay send back array
        if (!binDoc.exists) {
            return res.status(400).json({
                success: false,
                message: BinErrorMessages.MISSING_BINS
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
        console.error(BinErrorMessages.UPDATE_BIN_ERROR + " " +  binId, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
  
export default router;