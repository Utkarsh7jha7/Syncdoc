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

        const documentId =
            url.searchParams.get("documentId");

        if (!documentId) {

            ws.close();

            return;
        }

        // =========================================
        // CREATE DOCUMENT
        // =========================================

        if (!documents.has(documentId)) {

            documents.set(
                documentId,
                new Y.Doc()
            );

        }

        const ydoc =
            documents.get(documentId);

        console.log(
            `Client connected: ${documentId}`
        );

        // =========================================
        // SEND INITIAL DOCUMENT STATE
        // =========================================

        const initialUpdate =
            Y.encodeStateAsUpdate(ydoc);

        const initialMessage =
            new Uint8Array(
                initialUpdate.length + 1
            );

        initialMessage[0] = 0;

        initialMessage.set(
            initialUpdate,
            1
        );

        ws.send(initialMessage);

        // =========================================
        // RECEIVE MESSAGE
        // =========================================

        ws.on("message", (message) => {

            const data =
                new Uint8Array(message);

            if (data.length === 0) {
                return;
            }

            const messageType =
                data[0];

            const payload =
                data.slice(1);

            // =====================================
            // YJS DOCUMENT UPDATE
            // =====================================

            if (messageType === 0) {

                console.log(
                    "SERVER: YJS UPDATE"
                );

                Y.applyUpdate(
                    ydoc,
                    payload
                );

            }

            // =====================================
            // AWARENESS UPDATE
            // =====================================

            else if (messageType === 1) {

                console.log(
                    "SERVER: AWARENESS UPDATE"
                );

            }

            // =====================================
            // BROADCAST
            // =====================================

            wss.clients.forEach(
                (client) => {

                    if (
                        client !== ws &&
                        client.readyState === 1
                    ) {

                        client.send(data);

                    }

                }
            );

        });

        // =========================================
        // DISCONNECT
        // =========================================

        ws.on("close", () => {

            console.log(
                `Client disconnected: ${documentId}`
            );

        });

    });

    console.log(
        "Yjs WebSocket server initialized"
    );

    return wss;
};