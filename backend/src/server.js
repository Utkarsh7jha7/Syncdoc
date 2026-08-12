import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import documentRoutes from "./routes/documentRoutes.js";
import { createServer } from "http";
import blockRoutes from "./routes/blockRoutes.js";

import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const server = createServer(app);

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);

app.use(express.json());
app.use("/api/documents", documentRoutes);
app.use("/api/blocks", blockRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "SyncDoc backend is running"
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    server.listen(PORT, () => {
        console.log(`SyncDoc server running on port ${PORT}`);
    });
};

startServer();