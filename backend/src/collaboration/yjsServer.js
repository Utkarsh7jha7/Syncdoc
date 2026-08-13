import { WebSocketServer } from "ws";
import * as Y from "yjs";

const documents = new Map();

export const setupYjsServer = (server) => {

    const wss = new WebSocketServer({
        server
    });

    wss.on("connection", (ws, request) => {

        const url = new URL(
            request.url,
            "http://localhost"
        );

        const documentId = url.searchParams.get("documentId");

        if (!documentId) {
            ws.close();
            return;
        }

        if (!documents.has(documentId)) {

            documents.set(
                documentId,
                new Y.Doc()
            );
        }

        const ydoc = documents.get(documentId);

        console.log(
            `Client connected to document: ${documentId}`
        );

        ws.on("message", (message) => {

            const update = new Uint8Array(message);

            Y.applyUpdate(ydoc, update);

            wss.clients.forEach((client) => {

                if (
                    client !== ws &&
                    client.readyState === 1
                ) {
                    client.send(update);
                }

            });

        });

        ws.on("close", () => {

            console.log(
                `Client disconnected from document: ${documentId}`
            );

        });

    });

    console.log("Yjs WebSocket server initialized");
};