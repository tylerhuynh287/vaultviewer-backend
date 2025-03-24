import express, { Request, Response } from "express";
import admin from "firebase-admin";
import verifyToken from "../middleware/verifyToken";


interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

const router = express.Router();


// Get all bins
router.get("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId."
            });
        }

        const firestore = admin.firestore();
        const binsRef = firestore.collection("users").doc(userId).collection("bins");
        const snapshot = await binsRef.get();
    
        if (snapshot.empty) {
            return res.status(404).json({ 
                success: false, 
                message: "No bins found." 
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
        console.error("Error fetching bins:", error);
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
                message: "Missing userId."
            });
        }

        const firestore = admin.firestore();
        const binsRef = firestore.collection("users").doc(userId).collection("bins");
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

        if (!userId || !binId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId or binId."
            });
        }

        const firestore = admin.firestore();
        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        if (!binDoc.exists) {
            return res.status(404).json({ 
                success: false, 
                message: "Bin not found." 
            });
        }
  
        res.json({ 
            success: true,
            bin: binDoc.data()
        });
    } catch (error: any) {
        console.error("Error fetching bin:", error);
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

        if (!userId || !binId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId or binId."
            });
        }

        const firestore = admin.firestore();
        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        if (!binDoc.exists) {
            return res.status(404).json({ 
                success: false,
                message: "Bin not found."
            });
        }
    
        const updatedFields: Record<string, any> = {};
        if (name) updatedFields.name = name;
        if (qrCode) updatedFields.qrCode = qrCode;
        updatedFields.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
        await binRef.update(updatedFields);
    
        res.json({
            success: true,
            message: "Bin updated successfully.",
            updatedFields,
        });
    } catch (error: any) {
        console.error("Error updating bin:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Delete a bin and all items in it
router.delete("/:binId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { binId } = req.params;

        if (!userId || !binId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId or binId."
            });
        }

        const firestore = admin.firestore();
        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        if (!binDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Bin not found."
            });
        }
    
        const itemsRef = binRef.collection("items");
        const itemsSnapshot = await itemsRef.get();
    
        const deleteItemsPromises = itemsSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deleteItemsPromises);
    
        await binRef.delete();
    
        res.json({
            success: true,
            message: "Bin and all items deleted."
        });
    } catch (error: any) {
        console.error("Error deleting bin:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
  
export default router;