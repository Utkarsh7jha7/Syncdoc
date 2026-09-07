import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import documentRoutes from "./routes/documentRoutes.js";
import blockRoutes from "./routes/blockRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import { createServer } from "http";
import { setupYjsServer } from "./collaboration/yjsServer.js";

import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const server = createServer(app);


// =========================================
// CORS
// =========================================

app.use(
    cors({
        origin: "http://localhost:5173",
        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


// =========================================
// BODY PARSER
// =========================================

app.use(express.json());


// =========================================
// API ROUTES
// =========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/documents",
    documentRoutes
);

app.use(
    "/api/blocks",
    blockRoutes
);


// =========================================
// ROOT
// =========================================

app.get("/", (req, res) => {
    res.json({
        message: "SyncDoc backend is running"
    });
});


// =========================================
// SERVER
// =========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        setupYjsServer(server);

        server.listen(PORT, () => {
            console.log(
                `SyncDoc server running on port ${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "FAILED TO START SERVER:",
            error
        );
    }
};

startServer();