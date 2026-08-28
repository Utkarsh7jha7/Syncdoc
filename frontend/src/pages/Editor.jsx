import {
    getDocument,
    updateBlock,
    createBlock,
    deleteBlock,
    updateBlockChildren
} from "../services/documentService";

import EditableBlock
    from "../components/EditableBlock";

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
        "CURRENT USER:",
        currentUser
    );


    // =========================================
    // STATE
    // =========================================

    const [
        document,
        setDocument
    ] = useState(null);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        onlineUsers,
        setOnlineUsers
    ] = useState([]);


    const [
        activeUsers,
        setActiveUsers
    ] = useState({});

    const [draggedBlockId, setDraggedBlockId] = useState(null);


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

        let connection = null;


        // =====================================
        // ONLINE USERS
        // =====================================

        let updateOnlineUsers = null;


        // =====================================
        // BLOCK CHANGES
        // =====================================

        let handleBlocksChange = null;


        const loadDocument =
            async () => {

                try {

                    console.log(
                        "CALLING DOCUMENT API..."
                    );


                    // =================================
                    // GET DOCUMENT
                    // =================================

                    const data =
                        await getDocument(
                            DOCUMENT_ID
                        );


                    console.log(
                        "DOCUMENT RECEIVED:",
                        data
                    );


                    setDocument(
                        data.document
                    );


                    // =================================
                    // CREATE YJS CONNECTION
                    // =================================

                    connection =
                        createYjsConnection(
                            DOCUMENT_ID,
                            currentUser
                        );


                    yjsRef.current =
                        connection;


                    console.log(
                        "YJS CONNECTION CREATED"
                    );


                    const {
                        blocks,
                        awareness
                    } = connection;


                    // =================================
                    // ONLINE USERS
                    // =================================

                    updateOnlineUsers =
                        () => {

                            const states =
                                Array.from(
                                    awareness
                                        .getStates()
                                        .values()
                                );


                            const users =
                                states
                                    .map(
                                        (
                                            state
                                        ) => {

                                            if (
                                                !state.user
                                            ) {

                                                return null;

                                            }


                                            return {

                                                name:
                                                    state
                                                        .user
                                                        .name,

                                                editingBlock:
                                                    state
                                                        .editingBlock ||
                                                    null

                                            };

                                        }
                                    )
                                    .filter(
                                        Boolean
                                    );


                            setOnlineUsers(
                                users
                            );


                            // =================================
                            // BUILD ACTIVE USERS
                            // =================================

                            const editing =
                                {};


                            users.forEach(
                                (
                                    user
                                ) => {

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


                                    editing[
                                        user.editingBlock
                                    ].push({

                                        name:
                                            user.name

                                    });

                                }
                            );


                            setActiveUsers(
                                editing
                            );

                        };


                    awareness.on(
                        "change",
                        updateOnlineUsers
                    );


                    updateOnlineUsers();


                    // =================================
                    // BLOCK CHANGES
                    // =================================

                    handleBlocksChange =
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


                                        if (
                                            !yBlock
                                        ) {

                                            return;

                                        }


                                        const yText =
                                            yBlock.get(
                                                "content"
                                            );


                                        // Register the text
                                        // with UndoManager
                                        if (
                                            yText
                                        ) {

                                            connection
                                                .registerTextForUndo(
                                                    yText
                                                );

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
                                                yText
                                                    ? yText
                                                        .toString()
                                                    : "",

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

                                            children:
                                                []

                                        };


                                        setDocument(
                                            (
                                                previousDocument
                                            ) => {

                                                if (
                                                    !previousDocument
                                                ) {

                                                    return previousDocument;

                                                }


                                                const exists =
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
                                                    exists
                                                ) {

                                                    return previousDocument;

                                                }


                                                return {

                                                    ...previousDocument,

                                                    blocks:
                                                        [
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
                    // INITIALIZE BLOCKS
                    // =================================

                    if (
                        blocks.size === 0
                    ) {

                        console.log(
                            "INITIALIZING YJS BLOCKS"
                        );


                        data.document.blocks.forEach(
                            (
                                block
                            ) => {

                                const yBlock =
                                    new Y.Map();


                                yBlock.set(
                                    "type",
                                    block.type
                                );


                                yBlock.set(
                                    "level",
                                    block.level ||
                                    0
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
                                    block.content ||
                                    ""
                                );


                                yBlock.set(
                                    "content",
                                    yText
                                );


                                // Put block into YJS first
                                blocks.set(
                                    block._id,
                                    yBlock
                                );


                                // Now register text
                                // for Undo / Redo
                                connection
                                    .registerTextForUndo(
                                        yText
                                    );

                            }
                        );

                    } else {

                        // =================================
                        // REGISTER EXISTING YJS TEXTS
                        // =================================

                        blocks.forEach(
                            (
                                yBlock
                            ) => {

                                const yText =
                                    yBlock.get(
                                        "content"
                                    );


                                if (
                                    yText
                                ) {

                                    connection
                                        .registerTextForUndo(
                                            yText
                                        );

                                }

                            }
                        );

                    }


                    console.log(
                        "YJS BLOCKS:",
                        blocks.toJSON()
                    );


                } catch (
                error
                ) {

                    console.error(
                        "FAILED TO LOAD DOCUMENT:",
                        error
                    );


                } finally {

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
                "CLEANING UP EDITOR"
            );


            if (
                connection
            ) {

                if (
                    updateOnlineUsers
                ) {

                    connection.awareness.off(
                        "change",
                        updateOnlineUsers
                    );

                }


                if (
                    handleBlocksChange
                ) {

                    connection.blocks.unobserve(
                        handleBlocksChange
                    );

                }


                connection.awareness
                    .setLocalStateField(
                        "editingBlock",
                        null
                    );


                connection.destroy();


                yjsRef.current =
                    null;

            }

        };

    }, [
        currentUser
    ]);


    // =========================================
    // ADD BLOCK
    // =========================================

    const handleAddBlock =
        async (
            type
        ) => {

            try {

                const blockData = {
                    type,
                    content: "",
                    level: type === "heading" ? 2 : 0,
                    language:
                        type === "code"
                            ? "javascript"
                            : null,
                    documentId: DOCUMENT_ID
                };


                const data =
                    await createBlock(
                        blockData
                    );


                const newBlock =
                    data.block;


                const connection =
                    yjsRef.current;


                if (
                    !connection
                ) {

                    console.error(
                        "YJS CONNECTION NOT AVAILABLE"
                    );

                    return;

                }


                // =================================
                // CREATE YJS BLOCK
                // =================================

                const yBlock =
                    new Y.Map();


                yBlock.set(
                    "type",
                    newBlock.type
                );


                yBlock.set(
                    "level",
                    newBlock.level ||
                    0
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
                    newBlock.content ||
                    ""
                );


                yBlock.set(
                    "content",
                    yText
                );


                // =================================
                // REGISTER TEXT FOR UNDO
                // =================================

                connection.registerTextForUndo(
                    yText
                );


                // =================================
                // ADD TO YJS
                // =================================

                connection.blocks.set(
                    newBlock._id,
                    yBlock
                );


                console.log(
                    "BLOCK ADDED:",
                    newBlock._id
                );

            } catch (
            error
            ) {

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
        async (
            blockId
        ) => {

            try {

                console.log(
                    "DELETING BLOCK:",
                    blockId
                );


                // =================================
                // DELETE FROM MONGODB
                // =================================

                await deleteBlock(
                    blockId
                );


                // =================================
                // DELETE FROM YJS
                // =================================

                const connection =
                    yjsRef.current;


                if (
                    connection
                ) {

                    connection.blocks.delete(
                        blockId
                    );

                }


                console.log(
                    "BLOCK DELETED:",
                    blockId
                );

            } catch (
            error
            ) {

                console.error(
                    "FAILED TO DELETE BLOCK:",
                    error
                );

            }

        };


    // =========================================
    // DRAG START
    // =========================================

    const handleDragStart = (
        event,
        blockId
    ) => {

        setDraggedBlockId(
            blockId
        );

        event.dataTransfer.effectAllowed =
            "move";

        event.dataTransfer.setData(
            "text/plain",
            blockId
        );

    };


    // =========================================
    // DRAG OVER
    // =========================================

    const handleDragOver = (
        event
    ) => {

        event.preventDefault();

        event.dataTransfer.dropEffect =
            "move";

    };


    // =========================================
    // DROP BLOCK
    // =========================================

    const handleDrop = async (
        event,
        targetBlockId
    ) => {

        event.preventDefault();

        const sourceBlockId =
            event.dataTransfer.getData(
                "text/plain"
            );


        if (
            !sourceBlockId ||
            sourceBlockId === targetBlockId
        ) {

            setDraggedBlockId(null);

            return;

        }


        const currentBlocks =
            document.blocks;


        const sourceIndex =
            currentBlocks.findIndex(
                (block) =>
                    block._id ===
                    sourceBlockId
            );


        const targetIndex =
            currentBlocks.findIndex(
                (block) =>
                    block._id ===
                    targetBlockId
            );


        if (
            sourceIndex === -1 ||
            targetIndex === -1
        ) {

            setDraggedBlockId(null);

            return;

        }


        // -----------------------------------------
        // CREATE NEW ORDER
        // -----------------------------------------

        const reorderedBlocks =
            [...currentBlocks];


        const [
            movedBlock
        ] =
            reorderedBlocks.splice(
                sourceIndex,
                1
            );


        reorderedBlocks.splice(
            targetIndex,
            0,
            movedBlock
        );


        // -----------------------------------------
        // UPDATE UI IMMEDIATELY
        // -----------------------------------------

        setDocument(
            (previousDocument) => ({

                ...previousDocument,

                blocks:
                    reorderedBlocks

            })
        );


        setDraggedBlockId(null);


        // -----------------------------------------
        // SAVE ORDER TO MONGODB
        // -----------------------------------------

        try {

            await reorderBlocks(

                DOCUMENT_ID,

                reorderedBlocks.map(
                    (block) =>
                        block._id
                )

            );


            console.log(
                "BLOCK ORDER SAVED"
            );


        } catch (error) {

            console.error(
                "FAILED TO SAVE BLOCK ORDER:",
                error
            );

        }

    };

    // =========================================
    // ADD BLOCK AS CHILD
    // =========================================

    const handleAddChild = async (
        parentId,
        childId
    ) => {

        try {

            const parentBlock =
                document.blocks.find(
                    (block) =>
                        block._id === parentId
                );

            if (!parentBlock) {
                return;
            }

            // Prevent block becoming its own child
            if (parentId === childId) {
                return;
            }

            const currentChildren =
                parentBlock.children || [];

            // Prevent duplicate child
            if (
                currentChildren.some(
                    (child) =>
                        String(
                            typeof child === "object"
                                ? child._id
                                : child
                        ) === String(childId)
                )
            ) {
                return;
            }

            const updatedChildren = [
                ...currentChildren.map(
                    (child) =>
                        typeof child === "object"
                            ? child._id
                            : child
                ),
                childId
            ];

            await updateBlockChildren(
                parentId,
                updatedChildren
            );

            // Update local document
            setDocument(
                (previousDocument) => {

                    if (!previousDocument) {
                        return previousDocument;
                    }

                    return {
                        ...previousDocument,

                        blocks:
                            previousDocument.blocks.map(
                                (block) => {

                                    if (
                                        block._id ===
                                        parentId
                                    ) {

                                        return {
                                            ...block,
                                            children:
                                                updatedChildren
                                        };

                                    }

                                    return block;

                                }
                            )
                    };

                }
            );

            console.log(
                "CHILD BLOCK ADDED:",
                childId,
                "TO:",
                parentId
            );

        } catch (error) {

            console.error(
                "FAILED TO ADD CHILD BLOCK:",
                error
            );

        }

    };

    // =========================================
    // BLOCK FOCUS
    // =========================================

    const handleBlockFocus =
        (
            blockId
        ) => {

            const connection =
                yjsRef.current;


            if (
                !connection
            ) {

                return;

            }


            connection.awareness
                .setLocalStateField(
                    "editingBlock",
                    blockId
                );


            console.log(
                `${currentUser} is editing ${blockId}`
            );

        };


    // =========================================
    // BLOCK BLUR
    // =========================================

    const handleBlockBlur =
        (
            blockId
        ) => {

            const connection =
                yjsRef.current;


            if (
                !connection
            ) {

                return;

            }


            const currentState =
                connection.awareness
                    .getLocalState();


            // Only clear if this block is
            // still the active block.
            if (
                currentState?.editingBlock ===
                blockId
            ) {

                connection.awareness
                    .setLocalStateField(
                        "editingBlock",
                        null
                    );

            }


            console.log(
                `${currentUser} stopped editing ${blockId}`
            );

        };


    // =========================================
    // BLOCK CONTENT CHANGE
    // =========================================

    const handleBlockChange = (blockId, content) => {

        // =========================================
        // UPDATE REACT STATE
        // =========================================

        setDocument((previousDocument) => {

            if (!previousDocument) {
                return previousDocument;
            }

            return {
                ...previousDocument,

                blocks: previousDocument.blocks.map(
                    (block) => {

                        if (block._id === blockId) {

                            return {
                                ...block,
                                content
                            };

                        }

                        return block;

                    }
                )

            };

        });


        // =========================================
        // SAVE MERGED YJS CONTENT TO MONGODB
        // =========================================

        if (
            saveTimers.current[blockId]
        ) {

            clearTimeout(
                saveTimers.current[blockId]
            );

        }


        saveTimers.current[blockId] =
            setTimeout(async () => {

                try {

                    const connection =
                        yjsRef.current;

                    if (!connection) {
                        return;
                    }


                    const yBlock =
                        connection.blocks.get(
                            blockId
                        );

                    if (!yBlock) {
                        return;
                    }


                    const yText =
                        yBlock.get("content");

                    if (!yText) {
                        return;
                    }


                    // IMPORTANT:
                    // Read the FINAL merged Yjs value.
                    const mergedContent =
                        yText.toString();


                    await updateBlock(
                        blockId,
                        mergedContent
                    );


                    console.log(
                        "MERGED BLOCK SAVED:",
                        blockId,
                        mergedContent
                    );


                } catch (error) {

                    console.error(
                        "FAILED TO SAVE MERGED BLOCK:",
                        error
                    );

                }

            }, 500);

    };
    // =========================================
    // UNDO
    // =========================================

    const handleUndo =
        () => {

            const connection =
                yjsRef.current;


            if (
                !connection
            ) {

                console.log(
                    "YJS CONNECTION NOT AVAILABLE"
                );

                return;

            }


            if (
                !connection.undoManager.canUndo()
            ) {

                console.log(
                    "NOTHING TO UNDO"
                );

                return;

            }


            console.log(
                "UNDO PERFORMED"
            );


            connection.undoManager.undo();

        };


    // =========================================
    // REDO
    // =========================================

    const handleRedo =
        () => {

            const connection =
                yjsRef.current;


            if (
                !connection
            ) {

                console.log(
                    "YJS CONNECTION NOT AVAILABLE"
                );

                return;

            }


            if (
                !connection.undoManager.canRedo()
            ) {

                console.log(
                    "NOTHING TO REDO"
                );

                return;

            }


            console.log(
                "REDO PERFORMED"
            );


            connection.undoManager.redo();

        };
        // =========================================
// RENDER AST BLOCK
// =========================================

const renderBlock = (
    block,
    depth = 0
) => {

    const yBlock =
        yjsRef.current
            ?.blocks
            .get(block._id);

    return (

        <div
            key={block._id}
            style={{
                marginLeft:
                    `${depth * 30}px`,

                borderLeft:
                    depth > 0
                        ? "2px solid #374151"
                        : "none",

                paddingLeft:
                    depth > 0
                        ? "15px"
                        : "0",

                marginBottom:
                    "10px"
            }}
        >

            {/* ================================= */}
            {/* CURRENT BLOCK */}
            {/* ================================= */}

            <EditableBlock

                draggable={true}

                onDragStart={
                    (event) =>
                        handleDragStart(
                            event,
                            block._id
                        )
                }

                onDragOver={
                    handleDragOver
                }

                onDrop={
                    (event) =>
                        handleDrop(
                            event,
                            block._id
                        )
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


            {/* ================================= */}
            {/* CHILD BLOCKS */}
            {/* ================================= */}

            {block.children &&
             block.children.length > 0 && (

                <div
                    style={{
                        marginTop:
                            "10px"
                    }}
                >

                    {block.children.map(
                        (child) => {

                            /*
                             * populateAST() returns
                             * complete child objects.
                             *
                             * But if only an ID exists,
                             * find the block from the
                             * document.
                             */

                            const childBlock =
                                typeof child ===
                                "object"

                                    ? child

                                    : document.blocks.find(
                                        (item) =>
                                            String(
                                                item._id
                                            ) ===
                                            String(
                                                child
                                            )
                                    );


                            if (!childBlock) {
                                return null;
                            }


                            return renderBlock(
                                childBlock,
                                depth + 1
                            );

                        }
                    )}

                </div>

            )}

        </div>

    );

};

    // =========================================
    // LOADING
    // =========================================

    if (
        loading
    ) {

        return (

            <h2>
                Loading document...
            </h2>

        );

    }


    // =========================================
    // DOCUMENT NOT FOUND
    // =========================================

    if (
        !document
    ) {

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
                maxWidth:
                    "900px",

                margin:
                    "0 auto",

                padding:
                    "20px"
            }}
        >

            {/* ================================= */}
            {/* TITLE */}
            {/* ================================= */}

            <h1>
                {document.title}
            </h1>


            {/* ================================= */}
            {/* BUTTONS */}
            {/* ================================= */}

            <div
                style={{
                    display:
                        "flex",

                    gap:
                        "10px",

                    marginBottom:
                        "20px",

                    flexWrap:
                        "wrap"
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
                    onClick={
                        handleUndo
                    }
                >
                    ↶ Undo
                </button>


                <button
                    onClick={
                        handleRedo
                    }
                >
                    ↷ Redo
                </button>

            </div>


            {/* ================================= */}
            {/* CURRENT USER */}
            {/* ================================= */}

            <div
                style={{
                    marginBottom:
                        "20px",

                    padding:
                        "10px",

                    background:
                        "#1f2937",

                    color:
                        "white",

                    borderRadius:
                        "8px",

                    width:
                        "fit-content"
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
                    display:
                        "flex",

                    alignItems:
                        "center",

                    gap:
                        "8px",

                    marginBottom:
                        "20px",

                    flexWrap:
                        "wrap"
                }}
            >

                <strong>
                    Online:
                </strong>


                {onlineUsers.map(
                    (
                        user,
                        index
                    ) => (

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
                (
                    block
                ) => {

                    const yBlock =
                        yjsRef.current
                            ?.blocks
                            .get(
                                block._id
                            );


                    return (

                        <div
                            key={block._id}
                            style={{
                                marginBottom: "15px"
                            }}
                        >

                            <EditableBlock

                                draggable={true}

                                onDragStart={
                                    (event) =>
                                        handleDragStart(
                                            event,
                                            block._id
                                        )
                                }

                                onDragOver={
                                    handleDragOver
                                }

                                onDrop={
                                    (event) =>
                                        handleDrop(
                                            event,
                                            block._id
                                        )
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

                            {/* ================================= */}
                            {/* AST CHILD BUTTON */}
                            {/* ================================= */}

                            <button
                                onClick={() => {
                                    const child =
                                        document.blocks.find(
                                            (candidate) =>
                                                candidate._id !==
                                                block._id
                                        );
                                    if (child) {
                                        handleAddChild(
                                            block._id,
                                            child._id
                                        );
                                    }
                                }}
                                style={{
                                    marginTop: "5px",
                                    marginBottom: "15px",
                                    padding: "5px 10px",
                                    background: "#2563eb",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "5px",
                                    cursor: "pointer"
                                }}
                            >
                                + Make another block a child
                            </button>
                        </div>
                    );
                }
            )}
        </div>
    );
}
export default Editor;