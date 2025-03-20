require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

admin.initializeApp({
    credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
    databaseURL: "https://console.firebase.google.com/u/0/project/vaultviewer-ffc3d/overview"
});

const app = express();
app.use(express.json());
app.use(cors());

// API route to create a storage bin
app.post("/api/bins/create", async (req, res) => {
    try {
        const { userId, name, qrCode } = req.body;
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
    } catch (error) {
        console.error("Error creating bin:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API route to get all bins for a user
app.get("/api/bins/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const firestore = admin.firestore();

        const binsRef = firestore.collection("users").doc(userId).collection("bins");
        const snapshot = await binsRef.get();

        if (snapshot.empty) {
            return res.status(404).json({
                success: false,
                message: "No bins created yet!"
            });
        }

        let bins = [];
        snapshot.forEach(doc => bins.push({ 
            binId: doc.id,
            ...doc.data() 
        }));

        res.json({
            success: true,
            bins
        })
    } catch (error) {
        console.error("Error fetching bins:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API route to get a specific bin by ID
app.get("/api/bins/:userId/:binId", async (req, res) => {
    try {
        const { userId, binId } = req.params;
        const firestore = admin.firestore();

        const binsRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binsRef.get();

        if(!binDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Bin not found."
            });
        }

        res.json({
            success: true,
            bin: binDoc.data()
        });
    } catch (error) {
        console.error("Error fetching bin:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
})

// Api route to add an item to the bin
app.post("/api/items/add", async (req, res) => {
    try {
        const { userId, binId, name, category, quantity, notes } = req.body;
        const firestore = admin.firestore();

        const binsRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);
        const binDoc = await binsRef.get();

        if (!binDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Bin not found."
            });
        }

        const binName = binDoc.data().name;

        const itemsRef = binsRef.collection("items");

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
    } catch(error) {
        console.error("Error adding item:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API route to get all items in bin
app.get("/api/items/:userId/:binId", async (req, res) => {
    try {
        const { userId, binId } = req.params;
        const firestore = admin.firestore();

        const itemsRef = firestore.collection("users").doc(userId).collection("bins").doc(binId).collection("items");
        const snapshot = await itemsRef.get();

        if (snapshot.empty) {
            return res.status(404).json({
                success: false,
                message: "No items found in this bin."
            });
        }

        let items = [];
        snapshot.forEach(doc => items.push({
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

// API route to delete an item
app.delete("/api/items/:userId/:binId/:itemId", async (req, res) => {
    try {
        const { userId, binId, itemId } = req.params;
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
            success:true,
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

// API route for editing an item's details
app.put("/api/items/:userId/:binId/:itemId", async (req, res) => {
    try {
        const { userId, binId, itemId } = req.params;
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
        console.log("Error updating items:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API route for editing a bin's details
app.put("/api/bins/:userId/:binId", async (req, res) => {
    try {
        const { userId, binId } = req.params;
        const { name, qrCode } = req.body;
        const firestore = admin.firestore();

        const binRef = firestore.collection("users").doc(userId).collection("bins").doc(binId);

        const binDoc = await binRef.get();
        if (!binDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Bin not found."
            });
        }

        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (qrCode) updatedFields.qrCode = qrCode;
        updatedFields.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await binRef.update(updatedFields);

        res.json ({
            success: true,
            message: "Bin updated successfully.",
            updatedFields
        })
    } catch (error) {
        console.error("Error updating bin:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// API route for deleting a bin
app.delete("/api/bins/:userId/:binId", async (req, res) => {
    try {
        const { userId, binId } = req.params;
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
            message: "Bin and all associated items delete successfully."
        });
    } catch (error) {
        console.error("Error deleting bin:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Default check
app.get("/", (req, res) => {
    res.send("VaultViewer API is running.");
});

// Health check route - Jet requested
app.get("/health", (req, res) => {
    res.status(200).json({ message: "The application is up and running." });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));