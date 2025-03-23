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

app.use("/api/bins", binsRouter);
app.use("/api/items", itemsRouter);
app.use("/api/auth", authRouter);


// Default check
app.get("/", (req, res) => {
    res.send("VaultViewer API is running.");
})

// Health check route - Jet Requested
app.get("/health", (req, res) => {
    res.status(200).json({
        message: "The application is up and running"
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));