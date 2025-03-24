import express, { Request, Response } from "express";
import admin from "firebase-admin";
import verifyToken from "../middleware/verifyToken";

interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

const router = express.Router();


// Get all items in a bin
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
        const itemsRef = firestore.collection("users").doc(userId).collection("bins").doc(binId).collection("items");
        const snapshot = await itemsRef.get();
    
        if (snapshot.empty) {
            return res.status(404).json({
            success: false,
            message: "No items found in this bin."
            });
        }
        
        // Changed to .map for conciseness
        const items = snapshot.docs.map(doc => ({
            itemId: doc.id,
            ...doc.data()
        }));
    
        res.json({
            success: true,
            items 
        });
    } catch (error: any) {
        console.error("Error fetching items:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Add an item to a bin
router.post("/:binId", verifyToken, async (req : AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { binId } = req.params;
        const { name, category, quantity, notes } = req.body;

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
    
        const binName = binDoc.data()?.name || "Unnamed Bin";
        const itemsRef = binRef.collection("items");
        const newItemRef = itemsRef.doc();
    
        await newItemRef.set({
            itemId: newItemRef.id,
            name,
            category,
            quantity,
            notes,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    
        res.status(201).json({
            success: true,
            message: `Item added to bin: ${binName}`,
            itemId: newItemRef.id
        });
    } catch (error: any) {
        console.error("Error adding item:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Edit an item's details
router.put("/:binId/:itemId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { binId, itemId } = req.params;
        const { name, category, quantity, notes } = req.body;

        if (!userId || !binId || !itemId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId, binId, or itemId."
            });
        }

        const firestore = admin.firestore();
        const itemRef = firestore.collection("users").doc(userId).collection("bins").doc(binId).collection("items").doc(itemId);
        const itemDoc = await itemRef.get();
    
        if (!itemDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }
    
        const updatedFields: Record<string, any> = {};
        if (name) updatedFields.name = name;
        if (category) updatedFields.category = category;
        if (quantity) updatedFields.quantity = quantity;
        if (notes) updatedFields.notes = notes;
        updatedFields.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
        await itemRef.update(updatedFields);
    
        res.json({
            success: true,
            message: "Item updated successfully.",
            updatedFields
        });
    } catch (error: any) {
        console.error("Error updating item:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Delete an item
router.delete("/:binId/:itemId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { binId, itemId } = req.params;

        if (!userId || !binId || !itemId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId, binId, or itemId."
            });
        }

        const firestore = admin.firestore();
        const itemRef = firestore.collection("users").doc(userId).collection("bins").doc(binId).collection("items").doc(itemId);
        const itemDoc = await itemRef.get();
    
        if (!itemDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }
    
        await itemRef.delete();
    
        res.json({
            success: true,
            message: "Item deleted successfully."
        });
    } catch (error: any) {
        console.error("Error deleting item:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
  
export default router;