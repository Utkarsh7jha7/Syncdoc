import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";

export const createYjsConnection = (
    documentId,
    currentUser
) => {

    // =========================================
    // YJS DOCUMENT
    // =========================================

    const ydoc = new Y.Doc();

    const blocks =
        ydoc.getMap("blocks");


    // =========================================
    // AWARENESS
    // =========================================

    const awareness =
        new awarenessProtocol.Awareness(
            ydoc
        );

    awareness.setLocalState({
        user: {
            name: currentUser
        },

        editingBlock: null
    });


    // =========================================
    // UNDO / REDO
    // =========================================

    const undoRoot =
        ydoc.getText(
            "__undo_root__"
        );

    const undoManager =
        new Y.UndoManager(
            undoRoot,
            {
                captureTimeout: 500,

                trackedOrigins:
                    new Set([
                        "local"
                    ])
            }
        );


    // =========================================
    // REGISTER Y.TEXT FOR UNDO
    // =========================================

    const registeredTexts =
        new Set();


    const registerTextForUndo =
        (yText) => {

            if (!yText) {
                return;
            }

            if (
                registeredTexts.has(
                    yText
                )
            ) {
                return;
            }

            registeredTexts.add(
                yText
            );

            undoManager.addToScope(
                yText
            );

            console.log(
                "TEXT REGISTERED FOR UNDO:",
                yText.toString()
            );
        };


    // =========================================
    // WEBSOCKET
    // =========================================

    const socket =
        new WebSocket(
            `ws://localhost:5000?documentId=${documentId}`
        );

    socket.binaryType =
        "arraybuffer";

    let connected = false;

    const pendingMessages = [];


    // =========================================
    // YJS UPDATE
    // =========================================

    ydoc.on(
        "update",
        (
            update,
            origin
        ) => {

            if (
                origin === "remote"
            ) {
                return;
            }

            const message =
                new Uint8Array(
                    update.length + 1
                );

            // 0 = YJS update
            message[0] = 0;

            message.set(
                update,
                1
            );


            if (
                connected &&
                socket.readyState ===
                    WebSocket.OPEN
            ) {

                socket.send(
                    message
                );

            } else {

                pendingMessages.push(
                    message
                );

            }

        }
    );


    // =========================================
    // AWARENESS UPDATE
    // =========================================

    awareness.on(
        "update",
        ({
            added,
            updated,
            removed
        }) => {

            const clients = [
                ...added,
                ...updated,
                ...removed
            ];

            if (
                clients.length === 0
            ) {
                return;
            }

            const update =
                awarenessProtocol
                    .encodeAwarenessUpdate(
                        awareness,
                        clients
                    );

            const message =
                new Uint8Array(
                    update.length + 1
                );

            // 1 = Awareness
            message[0] = 1;

            message.set(
                update,
                1
            );


            if (
                connected &&
                socket.readyState ===
                    WebSocket.OPEN
            ) {

                socket.send(
                    message
                );

            }

        }
    );


    // =========================================
    // RECEIVE MESSAGE
    // =========================================

    socket.onmessage = (
        event
    ) => {

        const message =
            new Uint8Array(
                event.data
            );

        if (
            message.length === 0
        ) {
            return;
        }

        const type =
            message[0];

        const data =
            message.slice(1);


        // =====================================
        // YJS UPDATE
        // =====================================

        if (
            type === 0
        ) {

            Y.applyUpdate(
                ydoc,
                data,
                "remote"
            );

        }


        // =====================================
        // AWARENESS UPDATE
        // =====================================

        if (
            type === 1
        ) {

            awarenessProtocol
                .applyAwarenessUpdate(
                    awareness,
                    data,
                    "remote"
                );

        }

    };


    // =========================================
    // CONNECTION OPEN
    // =========================================

    socket.onopen = () => {

        connected = true;

        console.log(
            "CONNECTED TO COLLABORATION SERVER"
        );


        // -------------------------------------
        // SEND PENDING UPDATES
        // -------------------------------------

        while (
            pendingMessages.length > 0
        ) {

            const message =
                pendingMessages.shift();

            socket.send(
                message
            );

        }


        // -------------------------------------
        // SEND AWARENESS
        // -------------------------------------

        const awarenessUpdate =
            awarenessProtocol
                .encodeAwarenessUpdate(
                    awareness,
                    [
                        awareness.clientID
                    ]
                );

        const message =
            new Uint8Array(
                awarenessUpdate.length + 1
            );

        message[0] = 1;

        message.set(
            awarenessUpdate,
            1
        );

        socket.send(
            message
        );

    };


    // =========================================
    // SOCKET CLOSE
    // =========================================

    socket.onclose = () => {

        connected = false;

        console.log(
            "DISCONNECTED FROM SERVER"
        );

    };


    // =========================================
    // SOCKET ERROR
    // =========================================

    socket.onerror = (
        error
    ) => {

        console.error(
            "WEBSOCKET ERROR:",
            error
        );

    };


    // =========================================
    // DESTROY
    // =========================================

    const destroy = () => {

        console.log(
            "DESTROYING YJS CONNECTION"
        );

        awareness.setLocalState(
            null
        );


        if (
            socket.readyState ===
                WebSocket.OPEN ||
            socket.readyState ===
                WebSocket.CONNECTING
        ) {

            socket.close();

        }


        registeredTexts.clear();

        undoManager.destroy();

        ydoc.destroy();

    };


    // =========================================
    // RETURN
    // =========================================

    return {

        ydoc,

        blocks,

        socket,

        awareness,

        undoManager,

        registerTextForUndo,

        destroy

    };

};