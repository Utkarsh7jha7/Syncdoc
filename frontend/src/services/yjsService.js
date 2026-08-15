import * as Y from "yjs";

export const createYjsConnection = (documentId) => {

    // Create Yjs document
    const ydoc = new Y.Doc();

    // Map containing all blocks
    const blocks = ydoc.getMap("blocks");

    // Connect to backend WebSocket
    const socket = new WebSocket(
        `ws://localhost:5000?documentId=${documentId}`
    );

    socket.binaryType = "arraybuffer";

    let connected = false;

    // Store updates that happen before
    // WebSocket connection is ready
    const pendingUpdates = [];

    // =========================================
    // LOCAL YJS UPDATE
    // =========================================

    ydoc.on("update", (update, origin) => {

        console.log("YJS UPDATE CREATED");

        console.log("Origin:", origin);

        console.log(
            "Update size:",
            update.length
        );

        // Don't send updates received
        // from another user back to server
        if (origin === "remote") {

            console.log(
                "REMOTE UPDATE -> NOT SENDING BACK"
            );

            return;
        }

        // Send immediately if socket is ready
        if (
            connected &&
            socket.readyState === WebSocket.OPEN
        ) {

            console.log(
                "SENDING LOCAL UPDATE TO SERVER"
            );

            socket.send(update);

            return;
        }

        // Otherwise store it temporarily
        console.log(
            "WEBSOCKET NOT READY -> QUEUING UPDATE"
        );

        pendingUpdates.push(update);

    });

    // =========================================
    // RECEIVE UPDATE FROM SERVER
    // =========================================

    socket.onmessage = (event) => {

        console.log(
            "UPDATE RECEIVED FROM SERVER"
        );

        const update =
            new Uint8Array(event.data);

        console.log(
            "Remote update size:",
            update.length
        );

        // Apply as remote update
        Y.applyUpdate(
            ydoc,
            update,
            "remote"
        );

        console.log(
            "REMOTE UPDATE APPLIED"
        );

    };

    // =========================================
    // WEBSOCKET CONNECTED
    // =========================================

    socket.onopen = () => {

        connected = true;

        console.log(
            "CONNECTED TO COLLABORATION SERVER"
        );

        // Send updates that happened
        // before WebSocket opened
        while (
            pendingUpdates.length > 0
        ) {

            const update =
                pendingUpdates.shift();

            socket.send(update);

        }

    };

    // =========================================
    // WEBSOCKET CLOSED
    // =========================================

    socket.onclose = () => {

        connected = false;

        console.log(
            "DISCONNECTED FROM COLLABORATION SERVER"
        );

    };

    // =========================================
    // WEBSOCKET ERROR
    // =========================================

    socket.onerror = (error) => {

        console.error(
            "WEBSOCKET ERROR:",
            error
        );

    };

    return {
        ydoc,
        blocks,
        socket
    };
};