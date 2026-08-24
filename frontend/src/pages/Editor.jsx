import {
    getDocument,
    updateBlock,
    createBlock,
    deleteBlock
} from "../services/documentService";

import EditableBlock from "../components/EditableBlock";

import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    createYjsConnection
} from "../services/yjsService";

import * as Y from "yjs";

import {
    getCurrentUser
} from "../services/userService";


const DOCUMENT_ID =
    "6a7c775e1e1354cef663ebc5";


function Editor() {

    console.log(
        "EDITOR COMPONENT IS RUNNING"
    );

    const currentUser =
        getCurrentUser();

    console.log(
        "Current user:",
        currentUser
    );


    // =========================================
    // STATE
    // =========================================

    const [document, setDocument] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [onlineUsers, setOnlineUsers] =
        useState([]);

    const [activeUsers, setActiveUsers] =
        useState({});


    // =========================================
    // REFS
    // =========================================

    const saveTimers =
        useRef({});

    const yjsRef =
        useRef(null);


    // =========================================
    // LOAD DOCUMENT + YJS
    // =========================================

    useEffect(() => {

        console.log(
            "USE EFFECT IS RUNNING"
        );

        let connection = null;

        const loadDocument = async () => {

            console.log(
                "LOAD DOCUMENT FUNCTION STARTED"
            );

            try {

                // =================================
                // GET DOCUMENT
                // =================================

                console.log(
                    "CALLING API..."
                );

                const data =
                    await getDocument(
                        DOCUMENT_ID
                    );

                console.log(
                    "API RESPONSE:",
                    data
                );

                setDocument(
                    data.document
                );

                console.log(
                    "DOCUMENT SET"
                );


                // =================================
                // CREATE YJS CONNECTION
                // =================================

                connection =
                    createYjsConnection(
                        DOCUMENT_ID,
                        currentUser
                    );

                console.log(
                    "YJS CONNECTION CREATED"
                );

                yjsRef.current =
                    connection;


                console.log(
                    "CURRENT USER:",
                    currentUser
                );

                console.log(
                    "AWARENESS STATE:",
                    connection.awareness.getStates()
                );


                const {
                    blocks,
                    awareness
                } = connection;


                // =========================================
                // UPDATE ONLINE USERS
                // =========================================

                const updateOnlineUsers = () => {

                    const states =
                        Array.from(
                            awareness
                                .getStates()
                                .values()
                        );


                    const users =
                        states
                            .map((state) => {

                                if (!state.user) {
                                    return null;
                                }

                                return {
                                    name:
                                        state.user.name,

                                    editingBlock:
                                        state.editingBlock ||
                                        null
                                };

                            })
                            .filter(Boolean);


                    console.log(
                        "ONLINE USERS:",
                        users
                    );


                    setOnlineUsers(
                        users
                    );


                    // =====================================
                    // BUILD ACTIVE EDITING USERS
                    // =====================================

                    const editing = {};


                    users.forEach((user) => {

                        if (
                            !user.editingBlock
                        ) {
                            return;
                        }


                        if (
                            !editing[
                            user.editingBlock
                            ]
                        ) {

                            editing[
                                user.editingBlock
                            ] = [];

                        }


                        // IMPORTANT:
                        // Store object instead of string
                        editing[
                            user.editingBlock
                        ].push({
                            name: user.name
                        });

                    });


                    console.log(
                        "ACTIVE EDITING USERS:",
                        editing
                    );


                    setActiveUsers(
                        editing
                    );

                };


                // =========================================
                // AWARENESS LISTENER
                // =========================================

                awareness.on(
                    "change",
                    updateOnlineUsers
                );


                // Get initial users
                updateOnlineUsers();
                // =========================================
                // UNDO
                // =========================================

                const handleUndo = () => {

                    const connection = yjsRef.current;

                    if (!connection) {
                        return;
                    }

                    connection.undoManager.undo();

                };


                // =========================================
                // REDO
                // =========================================

                const handleRedo = () => {

                    const connection = yjsRef.current;

                    if (!connection) {
                        return;
                    }

                    connection.undoManager.redo();

                };


                // =========================================
                // BLOCK CONTENT CHANGE
                // =========================================

                const handleBlockChange =
                    (blockId, content, isRemote = false) => {


                        // =========================================
                        // YJS BLOCK CHANGES
                        // =========================================

                        const handleBlocksChange =
                            (event) => {

                                event.changes.keys.forEach(
                                    (
                                        change,
                                        blockId
                                    ) => {


                                        // =================================
                                        // NEW BLOCK
                                        // =================================

                                        if (
                                            change.action ===
                                            "add"
                                        ) {

                                            const yBlock =
                                                blocks.get(
                                                    blockId
                                                );


                                            if (!yBlock) {
                                                return;
                                            }


                                            const newBlock = {

                                                _id:
                                                    blockId,

                                                type:
                                                    yBlock.get(
                                                        "type"
                                                    ) ||
                                                    "paragraph",

                                                content:
                                                    yBlock
                                                        .get(
                                                            "content"
                                                        )
                                                        ?.toString() ||
                                                    "",

                                                level:
                                                    yBlock.get(
                                                        "level"
                                                    ) ||
                                                    0,

                                                language:
                                                    yBlock.get(
                                                        "language"
                                                    ) ||
                                                    null,

                                                children: []

                                            };


                                            console.log(
                                                "NEW REMOTE BLOCK:",
                                                newBlock
                                            );


                                            setDocument(
                                                (
                                                    previousDocument
                                                ) => {

                                                    if (
                                                        !previousDocument
                                                    ) {

                                                        return previousDocument;

                                                    }


                                                    const alreadyExists =
                                                        previousDocument
                                                            .blocks
                                                            .some(
                                                                (
                                                                    block
                                                                ) =>
                                                                    block._id ===
                                                                    blockId
                                                            );


                                                    if (
                                                        alreadyExists
                                                    ) {

                                                        return previousDocument;

                                                    }


                                                    return {

                                                        ...previousDocument,

                                                        blocks: [
                                                            ...previousDocument.blocks,
                                                            newBlock
                                                        ]

                                                    };

                                                }
                                            );

                                        }


                                        // =================================
                                        // DELETE BLOCK
                                        // =================================

                                        if (
                                            change.action ===
                                            "delete"
                                        ) {

                                            console.log(
                                                "REMOTE BLOCK DELETED:",
                                                blockId
                                            );


                                            setDocument(
                                                (
                                                    previousDocument
                                                ) => {

                                                    if (
                                                        !previousDocument
                                                    ) {

                                                        return previousDocument;

                                                    }


                                                    return {

                                                        ...previousDocument,

                                                        blocks:
                                                            previousDocument
                                                                .blocks
                                                                .filter(
                                                                    (
                                                                        block
                                                                    ) =>
                                                                        block._id !==
                                                                        blockId
                                                                )

                                                    };

                                                }
                                            );

                                        }

                                    }
                                );

                            };


                        blocks.observe(
                            handleBlocksChange
                        );


                        // =========================================
                        // INITIALIZE YJS BLOCKS
                        // =========================================

                        if (
                            blocks.size === 0
                        ) {

                            console.log(
                                "INITIALIZING YJS BLOCKS FROM MONGODB"
                            );


                            data.document.blocks.forEach(
                                (block) => {

                                    const yBlock =
                                        new Y.Map();


                                    yBlock.set(
                                        "type",
                                        block.type
                                    );


                                    yBlock.set(
                                        "level",
                                        block.level || 0
                                    );


                                    yBlock.set(
                                        "language",
                                        block.language ||
                                        null
                                    );


                                    const yText =
                                        new Y.Text();


                                    yText.insert(
                                        0,
                                        block.content || ""
                                    );


                                    yBlock.set(
                                        "content",
                                        yText
                                    );


                                    blocks.set(
                                        block._id,
                                        yBlock
                                    );

                                }
                            );

                        }


                        console.log(
                            "YJS BLOCKS:",
                            blocks.toJSON()
                        );


                    } catch (error) {

                        console.error(
                            "FAILED TO LOAD DOCUMENT:",
                            error
                        );

                    } finally {

                    console.log(
                        "FINISHED LOADING"
                    );

                    setLoading(
                        false
                    );

                }

            };


            loadDocument();


            // =========================================
            // CLEANUP
            // =========================================

            return () => {

                console.log(
                    "CLEANING UP YJS CONNECTION"
                );


                if (connection) {

                    connection.awareness.setLocalStateField(
                        "editingBlock",
                        null
                    );


                    connection.awareness.off(
                        "change",
                        updateOnlineUsers
                    );


                    connection.blocks.unobserve(
                        handleBlocksChange
                    );


                    connection.destroy();


                    yjsRef.current =
                        null;

                }

            };

        }, [currentUser]);


    // =========================================
    // ADD BLOCK
    // =========================================

    const handleAddBlock = async (type) => {

        try {

            const blockData = {
                type,
                content: "",
                level: type === "heading" ? 2 : 0,
                language:
                    type === "code"
                        ? "javascript"
                        : null
            };

            console.log(
                "CREATING BLOCK:",
                blockData
            );

            // -----------------------------------------
            // CREATE BLOCK IN MONGODB
            // -----------------------------------------

            const data = await createBlock(
                blockData
            );

            const newBlock = data.block;

            console.log(
                "BLOCK CREATED IN MONGODB:",
                newBlock
            );

            // -----------------------------------------
            // ADD BLOCK TO YJS
            // -----------------------------------------

            const connection = yjsRef.current;

            if (!connection) {
                console.error(
                    "YJS CONNECTION NOT AVAILABLE"
                );
                return;
            }

            const yBlock = new Y.Map();

            yBlock.set(
                "type",
                newBlock.type
            );

            yBlock.set(
                "level",
                newBlock.level || 0
            );

            yBlock.set(
                "language",
                newBlock.language || null
            );

            const yText = new Y.Text();

            yText.insert(
                0,
                newBlock.content || ""
            );

            yBlock.set(
                "content",
                yText
            );

            // -----------------------------------------
            // THIS WILL TRIGGER blocks.observe()
            // -----------------------------------------

            connection.blocks.set(
                newBlock._id,
                yBlock
            );

            console.log(
                "BLOCK ADDED TO YJS:",
                newBlock._id
            );

        } catch (error) {

            console.error(
                "FAILED TO CREATE BLOCK:",
                error
            );

        }

    };


    // =========================================
    // DELETE BLOCK
    // =========================================

    const handleDeleteBlock = async (blockId) => {

        try {

            console.log(
                "DELETING BLOCK:",
                blockId
            );

            // -----------------------------------------
            // DELETE FROM MONGODB
            // -----------------------------------------

            await deleteBlock(blockId);

            console.log(
                "BLOCK DELETED FROM MONGODB:",
                blockId
            );

            // -----------------------------------------
            // DELETE FROM YJS
            // -----------------------------------------

            const connection = yjsRef.current;

            if (!connection) {
                console.error(
                    "YJS CONNECTION NOT AVAILABLE"
                );
                return;
            }

            connection.blocks.delete(
                blockId
            );

            console.log(
                "BLOCK DELETED FROM YJS:",
                blockId
            );

            // blocks.observe() will now remove it
            // from React state.

        } catch (error) {

            console.error(
                "FAILED TO DELETE BLOCK:",
                error
            );

        }

    };


    // =========================================
    // BLOCK FOCUS
    // =========================================

    const handleBlockFocus =
        (blockId) => {

            const connection =
                yjsRef.current;


            if (!connection) {
                return;
            }


            console.log(
                `${currentUser} started editing block:`,
                blockId
            );


            connection.awareness.setLocalStateField(
                "editingBlock",
                blockId
            );

        };


    // =========================================
    // BLOCK BLUR
    // =========================================

    const handleBlockBlur =
        (blockId) => {

            const connection =
                yjsRef.current;


            if (!connection) {
                return;
            }


            console.log(
                `${currentUser} stopped editing block:`,
                blockId
            );


            connection.awareness.setLocalStateField(
                "editingBlock",
                null
            );

        };


    // =========================================
    // BLOCK CONTENT CHANGE
    // =========================================

    const handleBlockChange =
        (blockId, content, isRemote = false) => {


            // =================================
            // UPDATE REACT STATE
            // =================================

            setDocument(
                (previousDocument) => {

                    if (
                        !previousDocument
                    ) {

                        return previousDocument;

                    }


                    const updatedBlocks =
                        previousDocument.blocks.map(
                            (block) => {

                                if (
                                    block._id ===
                                    blockId
                                ) {

                                    return {

                                        ...block,

                                        content

                                    };

                                }


                                return block;

                            }
                        );


                    return {

                        ...previousDocument,

                        blocks:
                            updatedBlocks

                    };

                }
            );


            // =================================
            // CLEAR OLD TIMER
            // =================================

            if (
                saveTimers.current[
                blockId
                ]
            ) {

                clearTimeout(
                    saveTimers.current[
                    blockId
                    ]
                );

            }


            // =================================
            // SAVE TO MONGODB
            // =================================

            saveTimers.current[
                blockId
            ] = setTimeout(
                async () => {

                    try {

                        await updateBlock(
                            blockId,
                            content
                        );


                        console.log(
                            "BLOCK SAVED:",
                            blockId
                        );


                    } catch (error) {

                        console.error(
                            "FAILED TO SAVE BLOCK:",
                            error
                        );

                    }

                },
                500
            );

        };


    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (
            <h2>
                Loading document...
            </h2>
        );

    }


    // =========================================
    // DOCUMENT NOT FOUND
    // =========================================

    if (!document) {

        return (
            <h2>
                Document not found
            </h2>
        );

    }


    // =========================================
    // UI
    // =========================================

    return (

        <div
            style={{
                maxWidth: "900px",
                margin: "0 auto",
                padding: "20px"
            }}
        >

            {/* ================================= */}
            {/* TITLE */}
            {/* ================================= */}

            <h1>
                {document.title}
            </h1>


            {/* ================================= */}
            {/* ADD BLOCK BUTTONS */}
            {/* ================================= */}

            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "20px",
                    flexWrap: "wrap"
                }}
            >

                <button
                    onClick={() =>
                        handleAddBlock(
                            "paragraph"
                        )
                    }
                >
                    + Paragraph
                </button>


                <button
                    onClick={() =>
                        handleAddBlock(
                            "heading"
                        )
                    }
                >
                    + Heading
                </button>


                <button
                    onClick={() =>
                        handleAddBlock(
                            "code"
                        )
                    }
                >
                    + Code
                </button>


                <button
                    onClick={() =>
                        handleAddBlock(
                            "bullet"
                        )
                    }
                >
                    + Bullet
                </button>
                <button
                    onClick={handleUndo}
                >
                    ↶ Undo
                </button>

                <button
                    onClick={handleRedo}
                >
                    ↷ Redo
                </button>

            </div>


            {/* ================================= */}
            {/* CURRENT USER */}
            {/* ================================= */}

            <div
                style={{
                    marginBottom: "20px",
                    padding: "10px",
                    background: "#1f2937",
                    color: "white",
                    borderRadius: "8px",
                    width: "fit-content"
                }}
            >

                Editing as:{" "}

                <strong>
                    {currentUser}
                </strong>

            </div>


            {/* ================================= */}
            {/* ONLINE USERS */}
            {/* ================================= */}

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "20px",
                    flexWrap: "wrap"
                }}
            >

                <strong>
                    Online:
                </strong>


                {onlineUsers.map(
                    (user, index) => (

                        <span
                            key={
                                user.name +
                                index
                            }
                            style={{
                                padding:
                                    "5px 10px",

                                borderRadius:
                                    "20px",

                                background:
                                    "#1f7a4d",

                                color:
                                    "white"
                            }}
                        >

                            🟢{" "}
                            {user.name}

                        </span>

                    )
                )}

            </div>


            {/* ================================= */}
            {/* BLOCKS */}
            {/* ================================= */}

            {document.blocks.map(
                (block) => {

                    const yBlock =
                        yjsRef.current
                            ?.blocks
                            .get(
                                block._id
                            );


                    return (

                        <EditableBlock
                            key={
                                block._id
                            }

                            block={
                                block
                            }

                            yBlock={
                                yBlock
                            }

                            onChange={
                                handleBlockChange
                            }

                            onFocus={
                                handleBlockFocus
                            }

                            onBlur={
                                handleBlockBlur
                            }

                            onDelete={
                                handleDeleteBlock
                            }

                            editingUsers={
                                activeUsers[
                                block._id
                                ] || []
                            }

                        />

                    );

                }
            )}

        </div>

    );

}


export default Editor;