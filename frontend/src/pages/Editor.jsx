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

                // ---------------------------------
                // GET DOCUMENT FROM MONGODB
                // ---------------------------------

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


                // ---------------------------------
                // CREATE YJS CONNECTION
                // ---------------------------------

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


                // =================================
                // ONLINE USERS
                // =================================

                const updateOnlineUsers = () => {

                    const states =
                        Array.from(
                            awareness
                                .getStates()
                                .values()
                        );


                    const users =
                        states
                            .map(
                                (state) =>
                                    state.user
                            )
                            .filter(Boolean);


                    // Remove duplicate user names
                    const uniqueUsers =
                        Array.from(
                            new Map(
                                users.map(
                                    (user) => [
                                        user.name,
                                        user
                                    ]
                                )
                            ).values()
                        );


                    console.log(
                        "ONLINE USERS:",
                        uniqueUsers
                    );


                    setOnlineUsers(
                        uniqueUsers
                    );

                };


                awareness.on(
                    "change",
                    updateOnlineUsers
                );


                // Get current users immediately
                updateOnlineUsers();


                // =================================
                // YJS BLOCK CHANGES
                // =================================

                const handleBlocksChange =
                    (event) => {

                        event.changes.keys.forEach(
                            (
                                change,
                                blockId
                            ) => {


                                // -------------------------
                                // NEW BLOCK
                                // -------------------------

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


                                            // Prevent duplicate
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


                                // -------------------------
                                // DELETE BLOCK
                                // -------------------------

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


                // =================================
                // INITIALIZE YJS BLOCKS
                // =================================

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

                // Remove awareness listener
                connection.awareness.off(
                    "change",
                    updateOnlineUsers
                );


                // Remove blocks listener
                connection.blocks.unobserve(
                    handleBlocksChange
                );


                // Destroy YJS connection
                connection.destroy();


                yjsRef.current =
                    null;

            }

        };


    }, [currentUser]);


    // =========================================
    // ADD BLOCK
    // =========================================

    const handleAddBlock =
        async (type) => {

            try {

                const blockData = {

                    type,

                    content: "",

                    level:
                        type === "heading"
                            ? 2
                            : 0,

                    language:
                        type === "code"
                            ? "javascript"
                            : null

                };


                console.log(
                    "CREATING BLOCK:",
                    blockData
                );


                // ---------------------------------
                // CREATE IN MONGODB
                // ---------------------------------

                const data =
                    await createBlock(
                        blockData
                    );


                console.log(
                    "BLOCK CREATED:",
                    data
                );


                const newBlock =
                    data.block;


                // ---------------------------------
                // UPDATE REACT STATE
                // ---------------------------------

                setDocument(
                    (previousDocument) => ({

                        ...previousDocument,

                        blocks: [
                            ...previousDocument.blocks,
                            newBlock
                        ]

                    })
                );


                // ---------------------------------
                // ADD TO YJS
                // ---------------------------------

                const connection =
                    yjsRef.current;


                if (connection) {

                    const yBlock =
                        new Y.Map();


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
                        newBlock.language ||
                            null
                    );


                    const yText =
                        new Y.Text();


                    yText.insert(
                        0,
                        newBlock.content || ""
                    );


                    yBlock.set(
                        "content",
                        yText
                    );


                    connection.blocks.set(
                        newBlock._id,
                        yBlock
                    );


                    console.log(
                        "NEW BLOCK ADDED TO YJS:",
                        newBlock._id
                    );

                }


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

    const handleDeleteBlock =
        async (blockId) => {

            try {

                console.log(
                    "DELETING BLOCK:",
                    blockId
                );


                // ---------------------------------
                // DELETE FROM MONGODB
                // ---------------------------------

                await deleteBlock(
                    blockId
                );


                // ---------------------------------
                // DELETE FROM REACT STATE
                // ---------------------------------

                setDocument(
                    (previousDocument) => ({

                        ...previousDocument,

                        blocks:
                            previousDocument.blocks.filter(
                                (block) =>
                                    block._id !==
                                    blockId
                            )

                    })
                );


                // ---------------------------------
                // DELETE FROM YJS
                // ---------------------------------

                const connection =
                    yjsRef.current;


                if (connection) {

                    connection.blocks.delete(
                        blockId
                    );


                    console.log(
                        "BLOCK DELETED FROM YJS:",
                        blockId
                    );

                }


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

            setActiveUsers(
                (previous) => ({

                    ...previous,

                    [blockId]:
                        currentUser

                })
            );

        };


    // =========================================
    // BLOCK BLUR
    // =========================================

    const handleBlockBlur =
        (blockId) => {

            setActiveUsers(
                (previous) => {

                    const updated = {
                        ...previous
                    };


                    delete updated[
                        blockId
                    ];


                    return updated;

                }
            );

        };


    // =========================================
    // BLOCK CONTENT CHANGE
    // =========================================

    const handleBlockChange =
        (blockId, content) => {


            // ---------------------------------
            // UPDATE REACT STATE
            // ---------------------------------

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


            // ---------------------------------
            // CLEAR OLD SAVE TIMER
            // ---------------------------------

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


            // ---------------------------------
            // SAVE TO MONGODB
            // ---------------------------------

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
                        />

                    );

                }
            )}

        </div>

    );

}


export default Editor;