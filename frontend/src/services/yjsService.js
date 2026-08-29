import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";

export const createYjsConnection = (
    documentId,
    currentUser,
    onStatusChange = () => {}
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
    // CONNECTION STATE
    // =========================================

    let connectionStatus =
        "connecting";


    let destroyed =
        false;


    let reconnectTimer =
        null;


    let reconnectAttempts =
        0;


    const MAX_RECONNECT_DELAY =
        10000;


    const notifyStatus =
        (status) => {

            connectionStatus =
                status;

            console.log(
                "YJS CONNECTION STATUS:",
                status
            );

            onStatusChange(
                status
            );

        };


    // =========================================
    // WEBSOCKET
    // =========================================

    let socket = null;


    // =========================================
    // PENDING YJS MESSAGES
    // =========================================

    const pendingMessages =
        [];


    // =========================================
    // SEND MESSAGE
    // =========================================

    const sendMessage =
        (message) => {

            if (
                socket &&
                socket.readyState ===
                    WebSocket.OPEN
            ) {

                socket.send(
                    message
                );

                return true;

            }


            return false;

        };


    // =========================================
    // CREATE WEBSOCKET
    // =========================================

    const connect = () => {

        if (
            destroyed
        ) {

            return;

        }


        notifyStatus(
            "connecting"
        );


        console.log(
            "CONNECTING TO COLLABORATION SERVER..."
        );


        socket =
            new WebSocket(
                `ws://localhost:5000?documentId=${documentId}`
            );


        socket.binaryType =
            "arraybuffer";


        // =====================================
        // MESSAGE RECEIVED
        // =====================================

        socket.onmessage =
            (event) => {

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


                // =================================
                // YJS UPDATE
                // =================================

                if (
                    type === 0
                ) {

                    Y.applyUpdate(
                        ydoc,
                        data,
                        "remote"
                    );

                }


                // =================================
                // AWARENESS UPDATE
                // =================================

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


        // =====================================
        // SOCKET OPEN
        // =====================================

        socket.onopen =
            () => {

                reconnectAttempts =
                    0;


                notifyStatus(
                    "connected"
                );


                console.log(
                    "CONNECTED TO COLLABORATION SERVER"
                );


                // ---------------------------------
                // SEND PENDING YJS UPDATES
                // ---------------------------------

                while (
                    pendingMessages.length > 0
                ) {

                    const message =
                        pendingMessages.shift();


                    socket.send(
                        message
                    );

                }


                // ---------------------------------
                // SEND CURRENT DOCUMENT STATE
                // ---------------------------------

                const stateUpdate =
                    Y.encodeStateAsUpdate(
                        ydoc
                    );


                if (
                    stateUpdate.length > 0
                ) {

                    const stateMessage =
                        new Uint8Array(
                            stateUpdate.length + 1
                        );


                    stateMessage[0] =
                        0;


                    stateMessage.set(
                        stateUpdate,
                        1
                    );


                    socket.send(
                        stateMessage
                    );

                }


                // ---------------------------------
                // SEND AWARENESS
                // ---------------------------------

                const awarenessUpdate =
                    awarenessProtocol
                        .encodeAwarenessUpdate(
                            awareness,
                            [
                                awareness.clientID
                            ]
                        );


                const awarenessMessage =
                    new Uint8Array(
                        awarenessUpdate.length + 1
                    );


                awarenessMessage[0] =
                    1;


                awarenessMessage.set(
                    awarenessUpdate,
                    1
                );


                socket.send(
                    awarenessMessage
                );

            };


        // =====================================
        // SOCKET CLOSE
        // =====================================

        socket.onclose =
            () => {

                if (
                    destroyed
                ) {

                    return;

                }


                notifyStatus(
                    "disconnected"
                );


                console.log(
                    "DISCONNECTED FROM SERVER"
                );


                scheduleReconnect();

            };


        // =====================================
        // SOCKET ERROR
        // =====================================

        socket.onerror =
            (error) => {

                console.error(
                    "WEBSOCKET ERROR:",
                    error
                );


                notifyStatus(
                    "disconnected"
                );

            };

    };


    // =========================================
    // RECONNECT
    // =========================================

    const scheduleReconnect =
        () => {

            if (
                destroyed
            ) {

                return;

            }


            if (
                reconnectTimer
            ) {

                return;

            }


            reconnectAttempts++;


            const delay =
                Math.min(
                    1000 *
                    Math.pow(
                        2,
                        reconnectAttempts - 1
                    ),
                    MAX_RECONNECT_DELAY
                );


            console.log(
                `RECONNECTING IN ${delay}ms`
            );


            reconnectTimer =
                setTimeout(
                    () => {

                        reconnectTimer =
                            null;


                        connect();

                    },
                    delay
                );

        };


    // =========================================
    // YJS UPDATE
    // =========================================

    ydoc.on(
        "update",
        (
            update,
            origin
        ) => {

            // Ignore updates received
            // from remote users.
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
            message[0] =
                0;


            message.set(
                update,
                1
            );


            // ---------------------------------
            // SEND IMMEDIATELY
            // ---------------------------------

            if (
                !sendMessage(
                    message
                )
            ) {

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


            // 1 = awareness
            message[0] =
                1;


            message.set(
                update,
                1
            );


            sendMessage(
                message
            );

        }
    );


    // =========================================
    // DESTROY
    // =========================================

    const destroy =
        () => {

            if (
                destroyed
            ) {

                return;

            }


            destroyed =
                true;


            console.log(
                "DESTROYING YJS CONNECTION"
            );


            // ---------------------------------
            // Cancel reconnect
            // ---------------------------------

            if (
                reconnectTimer
            ) {

                clearTimeout(
                    reconnectTimer
                );

                reconnectTimer =
                    null;

            }


            // ---------------------------------
            // Clear awareness
            // ---------------------------------

            awareness.setLocalState(
                null
            );


            // ---------------------------------
            // Close socket
            // ---------------------------------

            if (
                socket &&
                (
                    socket.readyState ===
                        WebSocket.OPEN ||

                    socket.readyState ===
                        WebSocket.CONNECTING
                )
            ) {

                socket.close();

            }


            // ---------------------------------
            // Cleanup
            // ---------------------------------

            registeredTexts.clear();

            pendingMessages.length =
                0;


            undoManager.destroy();

            ydoc.destroy();


            notifyStatus(
                "disconnected"
            );

        };


    // =========================================
    // START CONNECTION
    // =========================================

    connect();


    // =========================================
    // RETURN
    // =========================================

    return {

        ydoc,

        blocks,

        get socket() {
            return socket;
        },

        awareness,

        undoManager,

        registerTextForUndo,

        destroy,

        get connectionStatus() {
            return connectionStatus;
        }

    };

};