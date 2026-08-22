import { WebSocketServer } from "ws";
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";

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
        // CREATE DOCUMENT STATE
        // =========================================

        if (!documents.has(documentId)) {

            const ydoc = new Y.Doc();

            const awareness =
                new awarenessProtocol.Awareness(
                    ydoc
                );

            documents.set(
                documentId,
                {
                    ydoc,
                    awareness,
                    clients: new Set()
                }
            );

        }

        const documentState =
            documents.get(documentId);

        const {
            ydoc,
            awareness,
            clients
        } = documentState;

        clients.add(ws);

        console.log(
            `Client connected to document: ${documentId}`
        );

        // =========================================
        // SEND CURRENT YJS DOCUMENT
        // =========================================

        const initialUpdate =
            Y.encodeStateAsUpdate(ydoc);

        const yjsMessage =
            new Uint8Array(
                initialUpdate.length + 1
            );

        yjsMessage[0] = 0;

        yjsMessage.set(
            initialUpdate,
            1
        );

        ws.send(yjsMessage);

        // =========================================
        // SEND EXISTING AWARENESS USERS
        // =========================================

        const awarenessStates =
            Array.from(
                awareness.getStates().keys()
            );

        if (awarenessStates.length > 0) {

            const awarenessUpdate =
                awarenessProtocol
                    .encodeAwarenessUpdate(
                        awareness,
                        awarenessStates
                    );

            const awarenessMessage =
                new Uint8Array(
                    awarenessUpdate.length + 1
                );

            awarenessMessage[0] = 1;

            awarenessMessage.set(
                awarenessUpdate,
                1
            );

            ws.send(awarenessMessage);

        }

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
            // YJS UPDATE
            // =====================================

            if (messageType === 0) {

                Y.applyUpdate(
                    ydoc,
                    payload,
                    "remote"
                );

                clients.forEach(
                    (client) => {

                        if (
                            client !== ws &&
                            client.readyState === 1
                        ) {

                            client.send(data);

                        }

                    }
                );

            }

            // =====================================
            // AWARENESS UPDATE
            // =====================================

            if (messageType === 1) {

                try {

                    awarenessProtocol
                        .applyAwarenessUpdate(
                            awareness,
                            payload,
                            ws
                        );

                    clients.forEach(
                        (client) => {

                            if (
                                client !== ws &&
                                client.readyState === 1
                            ) {

                                client.send(data);

                            }

                        }
                    );

                    console.log(
                        "AWARENESS UPDATE:",
                        Array.from(
                            awareness
                                .getStates()
                                .values()
                        )
                    );

                } catch (error) {

                    console.error(
                        "AWARENESS ERROR:",
                        error
                    );

                }

            }

        });

        // =========================================
        // CLIENT DISCONNECTED
        // =========================================

        ws.on("close", () => {

            clients.delete(ws);

            console.log(
                `Client disconnected from document: ${documentId}`
            );

            // Remove awareness states belonging
            // to disconnected clients where possible.

            if (clients.size === 0) {

                documents.delete(
                    documentId
                );

                console.log(
                    `Removed document state: ${documentId}`
                );

            }

        });

    });

    console.log(
        "Yjs WebSocket server initialized"
    );

    return wss;
};