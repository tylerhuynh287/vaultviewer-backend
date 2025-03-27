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


/**
 * @route GET /health
 * @description A simple health check route to verify the server's status.
 * This endpoint is typically used by load balancers and monitoring systems 
 * to ensure the server is up and running. It returns a 200 status code if the server is healthy.
 * 
 * @returns {Object} 200 - Success response with a message indicating the server is healthy.
 * @returns {Error} 500 - If there is an internal server error.
 */
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is healthy' });
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));