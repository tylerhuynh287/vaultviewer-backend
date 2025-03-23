const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const verifyToken = require("../middleware/verifyToken");


// Get all items in a bin
router.get("/:binId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { binId } = req.params;
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
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Add an item to a bin
router.post("/:binId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { binId } = req.params;
        const { name, category, quantity, notes } = req.body;
        const firestore = admin.firestore();
    
        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binRef.get();
    
        if (!binDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Bin not found."
            });
        }
    
        const binName = binDoc.data().name;
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
    } catch (error) {
        console.error("Error adding item:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Edit an item's details
router.put("/:binId/:itemId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { binId, itemId } = req.params;
        const { name, category, quantity, notes } = req.body;
        const firestore = admin.firestore();
    
        const itemRef = firestore.collection("users").doc(userId).collection("bins").doc(binId).collection("items").doc(itemId);
        const itemDoc = await itemRef.get();
    
        if (!itemDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }
    
        const updatedFields = {};
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
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Delete an item
router.delete("/:binId/:itemId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { binId, itemId } = req.params;
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
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
  
module.exports = router;