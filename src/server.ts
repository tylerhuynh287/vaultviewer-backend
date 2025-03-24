import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import admin from "firebase-admin";
import binsRouter from "./routes/bins";
import itemsRouter from "./routes/items";
import authRouter from "./routes/auth";

dotenv.config();

admin.initializeApp({
    credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS as string)),
    databaseURL: "https://vaultviewer-ffc3d.firebaseio.com"
});

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/bins", binsRouter);
app.use("/api/items", itemsRouter);
app.use("/api/auth", authRouter);


// Default check
app.get("/", (req: Request, res: Response) => {
    res.send("VaultViewer API is running.");
})

// Health check route - Jet Requested
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        message: "The application is up and running"
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));