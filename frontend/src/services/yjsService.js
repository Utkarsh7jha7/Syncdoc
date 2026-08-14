import * as Y from "yjs";

export const createYjsConnection = (documentId) => {

    const ydoc = new Y.Doc();

    const blocks = ydoc.getMap("blocks");

    const socket = new WebSocket(
        `ws://localhost:5000?documentId=${documentId}`
    );

    socket.binaryType = "arraybuffer";

    // Receive changes from other users
    socket.onmessage = (event) => {

        const update = new Uint8Array(event.data);

        Y.applyUpdate(ydoc, update);
    };

    socket.onopen = () => {

        console.log(
            "Connected to collaboration server"
        );

        // Send local Yjs changes to server
        ydoc.on("update", (update, origin) => {

            if (origin !== "remote" && socket.readyState === WebSocket.OPEN) {

                socket.send(update);

            }

        });
    };

    socket.onclose = () => {

        console.log(
            "Disconnected from collaboration server"
        );

    };

    socket.onerror = (error) => {

        console.error(
            "WebSocket error:",
            error
        );

    };

    return {
        ydoc,
        blocks,
        socket
    };
};