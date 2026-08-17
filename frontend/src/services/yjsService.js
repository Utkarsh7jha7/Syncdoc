import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";

export const createYjsConnection = (documentId, currentUser) => {

    const ydoc = new Y.Doc();

    const blocks = ydoc.getMap("blocks");

    // -----------------------------------------
    // Awareness
    // -----------------------------------------

    const awareness =
        new awarenessProtocol.Awareness(ydoc);

    awareness.setLocalStateField("user", {
        name: currentUser
    });

    // -----------------------------------------
    // WebSocket
    // -----------------------------------------

    const socket = new WebSocket(
        `ws://localhost:5000?documentId=${documentId}`
    );

    socket.binaryType = "arraybuffer";

    let connected = false;

    const pendingMessages = [];

    // =========================================
    // YJS DOCUMENT UPDATE
    // =========================================

    ydoc.on("update", (update, origin) => {

        if (origin === "remote") {
            return;
        }

        const message = new Uint8Array(
            update.length + 1
        );

        // 0 = Yjs update
        message[0] = 0;

        message.set(update, 1);

        if (
            connected &&
            socket.readyState === WebSocket.OPEN
        ) {

            console.log(
                "Sending YJS update"
            );

            socket.send(message);

        } else {

            pendingMessages.push(message);

        }

    });

    // =========================================
    // AWARENESS UPDATE
    // =========================================

    awareness.on(
        "update",
        ({ added, updated, removed }) => {

            const clients = [
                ...added,
                ...updated,
                ...removed
            ];

            if (clients.length === 0) {
                return;
            }

            const update =
                awarenessProtocol.encodeAwarenessUpdate(
                    awareness,
                    clients
                );

            const message = new Uint8Array(
                update.length + 1
            );

            // 1 = Awareness update
            message[0] = 1;

            message.set(update, 1);

            if (
                connected &&
                socket.readyState === WebSocket.OPEN
            ) {

                console.log(
                    "Sending awareness update"
                );

                socket.send(message);

            }

        }
    );

    // =========================================
    // RECEIVE MESSAGE
    // =========================================

    socket.onmessage = (event) => {

        const message =
            new Uint8Array(event.data);

        if (message.length === 0) {
            return;
        }

        const type = message[0];

        const data = message.slice(1);

        // -------------------------------------
        // YJS UPDATE
        // -------------------------------------

        if (type === 0) {

            console.log(
                "Received YJS update"
            );

            Y.applyUpdate(
                ydoc,
                data,
                "remote"
            );

        }

        // -------------------------------------
        // AWARENESS UPDATE
        // -------------------------------------

        if (type === 1) {

            console.log(
                "Received awareness update"
            );

            awarenessProtocol.applyAwarenessUpdate(
                awareness,
                data,
                "remote"
            );

        }

    };

    // =========================================
    // CONNECTED
    // =========================================

    socket.onopen = () => {

        connected = true;

        console.log(
            "CONNECTED TO COLLABORATION SERVER"
        );

        // Send queued Yjs updates
        while (
            pendingMessages.length > 0
        ) {

            const message =
                pendingMessages.shift();

            socket.send(message);

        }

        // Send our awareness state
        const awarenessUpdate =
            awarenessProtocol.encodeAwarenessUpdate(
                awareness,
                [awareness.clientID]
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

        socket.send(awarenessMessage);

    };

    // =========================================
    // CLOSED
    // =========================================

    socket.onclose = () => {

        connected = false;

        console.log(
            "DISCONNECTED FROM SERVER"
        );

    };

    // =========================================
    // ERROR
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
        socket,
        awareness
    };
};