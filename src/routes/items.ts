import express, { Request, Response } from "express";
import admin from "firebase-admin";
import verifyToken from "../middleware/verifyToken";
import { ErrorCodes, GenericErrorMessages } from "../enums/errors";
import { ItemErrorMessages, ItemSuccessMessages } from "../Firebase/item/itemsConstants";

interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}
interface ItemUpdatePayload {
    name?: string;
    category?: string;
    quantity?: number;
    notes?: string;
    updatedAt?: FirebaseFirestore.FieldValue;
}

const router = express.Router();

// Get all items in a bin
router.get("/:binId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { binId } = req.params;

        if (!userId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: GenericErrorMessages.MISSING_USER_ID
            });
        } else if (!binId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: ItemErrorMessages.MISSING_BIN_ID
            });
        }

        const firestore = admin.firestore();
        const itemsRef = firestore.collection("users").doc(userId).collection("bins").doc(binId).collection("items");
        const snapshot = await itemsRef.get();
        
        // Changed to .map for conciseness
        const items = snapshot.docs.map(doc => ({
            itemId: doc.id,
            ...doc.data()
        }));
    
        res.json({
            success: true,
            items,
        });
    } catch (error: any) {
        console.error(ItemErrorMessages.GENERIC_ITEM_ERROR, error);
        res.status(ErrorCodes.INTERNAL_SERVER_ERROR).json({
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

        if (!userId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: GenericErrorMessages.MISSING_USER_ID
            });
        } else if (!binId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: ItemErrorMessages.MISSING_BIN_ID
            });
        }

        const firestore = admin.firestore();
        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        if (!binDoc.exists) {
            return res.status(ErrorCodes.NOT_FOUND).json({
                success: false,
                message: ItemErrorMessages.MISSING_BIN_ID
            });
        }
    
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
            message: ItemSuccessMessages.ITEM_SUCCESS_CREATE,
            itemId: newItemRef.id
        });
    } catch (error: any) {
        console.error(ItemErrorMessages.CREATE_ITEM_ERROR, error);
        res.status(ErrorCodes.INTERNAL_SERVER_ERROR).json({
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

        if (!userId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: GenericErrorMessages.MISSING_USER_ID
            });
        } else if (!binId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: ItemErrorMessages.MISSING_BIN_ID
            });
        } else if (!itemId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: ItemErrorMessages.MISSING_ITEM_ID
            });
        }

        const firestore = admin.firestore();
        const itemRef = firestore.collection("users").doc(userId).collection("bins").doc(binId).collection("items").doc(itemId);
        const itemDoc = await itemRef.get();
    
        if (!itemDoc.exists) {
            return res.status(ErrorCodes.NOT_FOUND).json({
                success: false,
                message: ItemErrorMessages.MISSING_ITEM
            });
        }
    
        const updatedFields: ItemUpdatePayload = {};
        if (name) updatedFields.name = name;
        if (category) updatedFields.category = category;
        if (quantity) updatedFields.quantity = quantity;
        if (notes) updatedFields.notes = notes;
        updatedFields.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
        await itemRef.update(updatedFields as FirebaseFirestore.UpdateData<ItemUpdatePayload>);
    
        res.json({
            success: true,
            message: ItemSuccessMessages.ITEM_SUCCESS_UPDATE,
            updatedFields
        });
    } catch (error: any) {
        console.error(ItemErrorMessages.UPDATE_ITEM_ERROR, error);
        res.status(ErrorCodes.INTERNAL_SERVER_ERROR).json({
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

        if (!userId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: GenericErrorMessages.MISSING_USER_ID
            });
        } else if (!binId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: ItemErrorMessages.MISSING_BIN_ID
            });
        } else if (!itemId) {
            return res.status(ErrorCodes.BAD_REQUEST).json({
                success: false,
                message: ItemErrorMessages.MISSING_ITEM_ID
            });
        }

        const firestore = admin.firestore();
        const itemRef = firestore.collection("users").doc(userId).collection("bins").doc(binId).collection("items").doc(itemId);
        const itemDoc = await itemRef.get();
    
        if (!itemDoc.exists) {
            return res.status(ErrorCodes.NOT_FOUND).json({
                success: false,
                message: ItemErrorMessages.MISSING_ITEM
            });
        }
    
        await itemRef.delete();
    
        res.json({
            success: true,
            message: ItemSuccessMessages.ITEM_SUCCESS_DELETE
        });
    } catch (error: any) {
        console.error(ItemErrorMessages.DELETE_ITEM_ERROR, error);
        res.status(ErrorCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message
        });
    }
});
  
export default router;