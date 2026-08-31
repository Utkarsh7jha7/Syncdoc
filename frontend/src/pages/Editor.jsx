import {
    getDocument,
    updateBlock,
    createBlock,
    deleteBlock,
    updateBlockChildren,
    reorderBlocks,
    createVersion,
    getVersions,
    restoreVersion
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

    // =========================================
    // CURRENT USER
    // =========================================

    const currentUser =
        getCurrentUser();


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

    const [
        draggedBlockId,
        setDraggedBlockId
    ] = useState(null);

    const [
        connectionStatus,
        setConnectionStatus
    ] = useState("connecting");
    const [
        versions,
        setVersions
    ] = useState([]);

    const [
        showVersions,
        setShowVersions
    ] = useState(false);


    // =========================================
    // REFS
    // =========================================

    const saveTimers =
        useRef({});

    const yjsRef =
        useRef(null);
    const blockObserversRef = useRef(new Map());
    // =========================================
    // OBSERVE YJS BLOCK METADATA
    // =========================================

    const observeYBlock = (blockId, yBlock) => {

        if (!yBlock) {
            return;
        }

        // Don't attach twice
        if (
            blockObserversRef.current.has(blockId)
        ) {
            return;
        }

        const observer = (event) => {

            const changedKeys =
                Array.from(
                    event.keysChanged
                );

            if (
                !changedKeys.includes("parentId") &&
                !changedKeys.includes("children")
            ) {
                return;
            }

            const newParentId =
                yBlock.get("parentId") || null;

            const newChildren =
                yBlock.get("children") || [];

            console.log(
                "REMOTE AST CHANGE:",
                {
                    blockId,
                    parentId: newParentId,
                    children: newChildren
                }
            );

            setDocument((previousDocument) => {

                if (!previousDocument) {
                    return previousDocument;
                }

                return {
                    ...previousDocument,

                    blocks:
                        previousDocument.blocks.map(
                            (block) => {

                                if (
                                    String(block._id) ===
                                    String(blockId)
                                ) {

                                    return {
                                        ...block,
                                        parentId:
                                            newParentId,
                                        children:
                                            newChildren
                                    };

                                }

                                return block;

                            }
                        )
                };

            });

        };

        yBlock.observe(observer);

        blockObserversRef.current.set(
            blockId,
            observer
        );
    };


    // =========================================
    // LOAD DOCUMENT + YJS
    // =========================================

    useEffect(() => {

        let connection = null;

        let updateOnlineUsers = null;

        let handleBlocksChange = null;


        const loadDocument = async () => {

            try {

                // =================================
                // GET DOCUMENT
                // =================================

                const data =
                    await getDocument(
                        DOCUMENT_ID
                    );


                if (
                    !data ||
                    !data.document
                ) {

                    setDocument(null);

                    return;

                }


                setDocument(
                    data.document
                );


                // =================================
                // CREATE YJS CONNECTION
                // =================================

                connection =
                    createYjsConnection(
                        DOCUMENT_ID,
                        currentUser,
                        (status) => {

                            setConnectionStatus(
                                status
                            );

                        }
                    );


                yjsRef.current =
                    connection;


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
                                    (state) => {

                                        if (
                                            !state.user
                                        ) {

                                            return null;

                                        }


                                        return {

                                            name:
                                                state.user.name,

                                            editingBlock:
                                                state.editingBlock ||
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
                        // ACTIVE EDITING USERS
                        // =================================

                        const editing = {};


                        users.forEach(
                            (user) => {

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
                // YJS BLOCK ADD / DELETE
                // =================================

                handleBlocksChange =
                    (event) => {

                        event.changes.keys.forEach(
                            (
                                change,
                                blockId
                            ) => {

                                // =============================
                                // NEW BLOCK
                                // =============================

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
                                    observeYBlock(
                                        blockId,
                                        yBlock
                                    );


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


                                    const children =
                                        yBlock.get(
                                            "children"
                                        ) || [];


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
                                                ? yText.toString()
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

                                        parentId:
                                            yBlock.get(
                                                "parentId"
                                            ) ||
                                            null,

                                        children

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
                                                            String(
                                                                block._id
                                                            ) ===
                                                            String(
                                                                blockId
                                                            )
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


                                // =============================
                                // DELETE BLOCK
                                // =============================

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
                                                                String(
                                                                    block._id
                                                                ) !==
                                                                String(
                                                                    blockId
                                                                )
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
                // INITIALIZE YJS
                // =================================

                if (
                    blocks.size === 0
                ) {

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


                            yBlock.set(
                                "parentId",
                                block.parentId ||
                                null
                            );


                            yBlock.set(
                                "children",
                                (
                                    block.children ||
                                    []
                                ).map(
                                    (
                                        child
                                    ) =>
                                        typeof child ===
                                            "object"
                                            ? child._id
                                            : child
                                )
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


                            blocks.set(
                                block._id,
                                yBlock
                            );
                            observeYBlock(
                                block._id,
                                yBlock
                            );


                            connection
                                .registerTextForUndo(
                                    yText
                                );

                        }
                    );

                } else {

                    blocks.forEach(
                        (
                            yBlock,
                            blockId
                        ) => {

                            // Observe parentId / children
                            observeYBlock(
                                blockId,
                                yBlock
                            );

                            // Register text for undo
                            const yText =
                                yBlock.get(
                                    "content"
                                );

                            if (yText) {

                                connection
                                    .registerTextForUndo(
                                        yText
                                    );

                            }

                        }
                    );

                }

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
                blockObserversRef.current.forEach(
                    (
                        observer,
                        blockId
                    ) => {

                        const yBlock =
                            connection.blocks.get(
                                blockId
                            );

                        if (yBlock) {

                            yBlock.unobserve(
                                observer
                            );

                        }

                    }
                );

                blockObserversRef.current.clear();


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

                    content:
                        "",

                    level:
                        type === "heading"
                            ? 2
                            : 0,

                    language:
                        type === "code"
                            ? "javascript"
                            : null,

                    parentId:
                        null,

                    children:
                        [],

                    documentId:
                        DOCUMENT_ID

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

                    return;

                }


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


                yBlock.set(
                    "parentId",
                    null
                );


                yBlock.set(
                    "children",
                    []
                );


                const yText =
                    new Y.Text();


                yBlock.set(
                    "content",
                    yText
                );


                connection.registerTextForUndo(
                    yText
                );


                connection.blocks.set(
                    newBlock._id,
                    yBlock
                );
                observeYBlock(
                    newBlock._id,
                    yBlock
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

                await deleteBlock(
                    blockId
                );


                const connection =
                    yjsRef.current;


                if (
                    connection
                ) {

                    connection.blocks.delete(
                        blockId
                    );

                }


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

    const handleDragStart =
        (
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

    const handleDragOver =
        (
            event
        ) => {

            event.preventDefault();


            event.dataTransfer.dropEffect =
                "move";

        };


    // =========================================
    // CHECK DESCENDANT
    // =========================================

    const isDescendant =
        (
            parentId,
            possibleChildId
        ) => {

            if (
                !document
            ) {

                return false;

            }


            const parent =
                document.blocks.find(
                    (block) =>
                        String(
                            block._id
                        ) ===
                        String(
                            parentId
                        )
                );


            if (
                !parent
            ) {

                return false;

            }


            for (
                const child
                of parent.children || []
            ) {

                const childId =
                    typeof child ===
                        "object"
                        ? child._id
                        : child;


                if (
                    String(
                        childId
                    ) ===
                    String(
                        possibleChildId
                    )
                ) {

                    return true;

                }


                if (
                    isDescendant(
                        childId,
                        possibleChildId
                    )
                ) {

                    return true;

                }

            }


            return false;

        };


    // =========================================
    // UPDATE YJS RELATIONSHIP
    // =========================================

    const updateYjsRelationship =
        (
            sourceBlockId,
            newParentId,
            newParentChildren,
            oldParentId,
            oldParentChildren
        ) => {

            const connection =
                yjsRef.current;


            if (
                !connection
            ) {

                return;

            }


            const sourceYBlock =
                connection.blocks.get(
                    sourceBlockId
                );


            if (
                sourceYBlock
            ) {

                sourceYBlock.set(
                    "parentId",
                    newParentId
                );

            }


            if (
                newParentId
            ) {

                const newParentYBlock =
                    connection.blocks.get(
                        newParentId
                    );


                if (
                    newParentYBlock
                ) {

                    newParentYBlock.set(
                        "children",
                        newParentChildren
                    );

                }

            }


            if (
                oldParentId
            ) {

                const oldParentYBlock =
                    connection.blocks.get(
                        oldParentId
                    );


                if (
                    oldParentYBlock
                ) {

                    oldParentYBlock.set(
                        "children",
                        oldParentChildren
                    );

                }

            }

        };


    // =========================================
    // MOVE BLOCK TO ROOT
    // =========================================

    const handleMoveToRoot =
        async (
            sourceBlockId
        ) => {

            if (
                !document
            ) {

                return;

            }


            const sourceBlock =
                document.blocks.find(
                    (block) =>
                        String(
                            block._id
                        ) ===
                        String(
                            sourceBlockId
                        )
                );


            if (
                !sourceBlock
            ) {

                return;

            }


            const oldParentId =
                sourceBlock.parentId ||
                null;


            // Already root
            if (
                !oldParentId
            ) {

                setDraggedBlockId(
                    null
                );

                return;

            }


            const oldParent =
                document.blocks.find(
                    (block) =>
                        String(
                            block._id
                        ) ===
                        String(
                            oldParentId
                        )
                );


            const oldParentChildren =
                oldParent
                    ? (
                        oldParent.children ||
                        []
                    )
                        .map(
                            (child) =>
                                typeof child ===
                                    "object"
                                    ? child._id
                                    : child
                        )
                        .filter(
                            (childId) =>
                                String(
                                    childId
                                ) !==
                                String(
                                    sourceBlockId
                                )
                        )
                    : [];


            // =================================
            // UPDATE OLD PARENT
            // =================================

            if (
                oldParent
            ) {

                await updateBlockChildren(
                    oldParentId,
                    oldParentChildren
                );

            }


            // =================================
            // UPDATE CHILD PARENT
            // =================================

            const response =
                await fetch(
                    `http://localhost:5000/api/blocks/${sourceBlockId}`,
                    {
                        method:
                            "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                parentId:
                                    null
                            })

                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    "Failed to move block to root"
                );

            }


            // =================================
            // UPDATE DOCUMENT ROOT ORDER
            // =================================

            const currentRootIds =
                document.blocks
                    .filter(
                        (block) =>
                            !block.parentId &&
                            String(
                                block._id
                            ) !==
                            String(
                                sourceBlockId
                            )
                    )
                    .map(
                        (block) =>
                            block._id
                    );


            currentRootIds.push(
                sourceBlockId
            );


            await reorderBlocks(
                DOCUMENT_ID,
                currentRootIds
            );


            // =================================
            // UPDATE REACT
            // =================================

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
                                .map(
                                    (
                                        block
                                    ) => {

                                        if (
                                            String(
                                                block._id
                                            ) ===
                                            String(
                                                sourceBlockId
                                            )
                                        ) {

                                            return {

                                                ...block,

                                                parentId:
                                                    null

                                            };

                                        }


                                        if (
                                            String(
                                                block._id
                                            ) ===
                                            String(
                                                oldParentId
                                            )
                                        ) {

                                            return {

                                                ...block,

                                                children:
                                                    oldParentChildren

                                            };

                                        }


                                        return block;

                                    }
                                )

                    };

                }
            );


            // =================================
            // UPDATE YJS
            // =================================

            updateYjsRelationship(
                sourceBlockId,
                null,
                [],
                oldParentId,
                oldParentChildren
            );


            setDraggedBlockId(
                null
            );


            console.log(
                "BLOCK MOVED TO ROOT:",
                sourceBlockId
            );

        };


    // =========================================
    // DROP BLOCK ON ANOTHER BLOCK
    // =========================================

    const handleDrop =
        async (
            event,
            targetBlockId
        ) => {

            event.preventDefault();


            const sourceBlockId =
                event.dataTransfer.getData(
                    "text/plain"
                );


            if (
                !sourceBlockId
            ) {

                setDraggedBlockId(
                    null
                );

                return;

            }


            if (
                sourceBlockId ===
                targetBlockId
            ) {

                setDraggedBlockId(
                    null
                );

                return;

            }


            if (
                isDescendant(
                    sourceBlockId,
                    targetBlockId
                )
            ) {

                console.warn(
                    "CANNOT CREATE CIRCULAR AST"
                );


                setDraggedBlockId(
                    null
                );

                return;

            }


            const sourceBlock =
                document.blocks.find(
                    (block) =>
                        String(
                            block._id
                        ) ===
                        String(
                            sourceBlockId
                        )
                );


            const targetBlock =
                document.blocks.find(
                    (block) =>
                        String(
                            block._id
                        ) ===
                        String(
                            targetBlockId
                        )
                );


            if (
                !sourceBlock ||
                !targetBlock
            ) {

                setDraggedBlockId(
                    null
                );

                return;

            }


            const oldParentId =
                sourceBlock.parentId ||
                null;


            // =================================
            // REMOVE FROM OLD PARENT
            // =================================

            let oldParentChildren =
                [];


            if (
                oldParentId
            ) {

                const oldParent =
                    document.blocks.find(
                        (block) =>
                            String(
                                block._id
                            ) ===
                            String(
                                oldParentId
                            )
                    );


                if (
                    oldParent
                ) {

                    oldParentChildren =
                        (
                            oldParent.children ||
                            []
                        )
                            .map(
                                (child) =>
                                    typeof child ===
                                        "object"
                                        ? child._id
                                        : child
                            )
                            .filter(
                                (childId) =>
                                    String(
                                        childId
                                    ) !==
                                    String(
                                        sourceBlockId
                                    )
                            );


                    await updateBlockChildren(
                        oldParentId,
                        oldParentChildren
                    );

                }

            }


            // =================================
            // TARGET CHILDREN
            // =================================

            const targetChildren =
                (
                    targetBlock.children ||
                    []
                )
                    .map(
                        (child) =>
                            typeof child ===
                                "object"
                                ? child._id
                                : child
                    )
                    .filter(
                        (childId) =>
                            String(
                                childId
                            ) !==
                            String(
                                sourceBlockId
                            )
                    );


            targetChildren.push(
                sourceBlockId
            );


            // =================================
            // UPDATE TARGET CHILDREN
            // =================================

            await updateBlockChildren(
                targetBlockId,
                targetChildren
            );


            // =================================
            // UPDATE SOURCE PARENT
            // =================================

            const response =
                await fetch(
                    `http://localhost:5000/api/blocks/${sourceBlockId}`,
                    {
                        method:
                            "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                parentId:
                                    targetBlockId
                            })

                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    "Failed to update block parent"
                );

            }


            // =================================
            // UPDATE REACT
            // =================================

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
                                .map(
                                    (
                                        block
                                    ) => {

                                        if (
                                            String(
                                                block._id
                                            ) ===
                                            String(
                                                sourceBlockId
                                            )
                                        ) {

                                            return {

                                                ...block,

                                                parentId:
                                                    targetBlockId

                                            };

                                        }


                                        if (
                                            String(
                                                block._id
                                            ) ===
                                            String(
                                                targetBlockId
                                            )
                                        ) {

                                            return {

                                                ...block,

                                                children:
                                                    targetChildren

                                            };

                                        }


                                        if (
                                            oldParentId &&
                                            String(
                                                block._id
                                            ) ===
                                            String(
                                                oldParentId
                                            )
                                        ) {

                                            return {

                                                ...block,

                                                children:
                                                    oldParentChildren

                                            };

                                        }


                                        return block;

                                    }
                                )

                    };

                }
            );


            // =================================
            // UPDATE YJS
            // =================================

            updateYjsRelationship(
                sourceBlockId,
                targetBlockId,
                targetChildren,
                oldParentId,
                oldParentChildren
            );


            setDraggedBlockId(
                null
            );


            console.log(
                "BLOCK NESTED:",
                sourceBlockId,
                "→",
                targetBlockId
            );

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


            const state =
                connection.awareness
                    .getLocalState();


            if (
                state?.editingBlock ===
                blockId
            ) {

                connection.awareness
                    .setLocalStateField(
                        "editingBlock",
                        null
                    );

            }

        };


    // =========================================
    // BLOCK CONTENT CHANGE
    // =========================================

    const handleBlockChange =
        (
            blockId,
            content
        ) => {

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
                                .map(
                                    (
                                        block
                                    ) => {

                                        if (
                                            String(
                                                block._id
                                            ) ===
                                            String(
                                                blockId
                                            )
                                        ) {

                                            return {

                                                ...block,

                                                content

                                            };

                                        }


                                        return block;

                                    }
                                )

                    };

                }
            );


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


            saveTimers.current[
                blockId
            ] =
                setTimeout(
                    async () => {

                        try {

                            const connection =
                                yjsRef.current;


                            if (
                                !connection
                            ) {

                                return;

                            }


                            const yBlock =
                                connection.blocks.get(
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


                            if (
                                !yText
                            ) {

                                return;

                            }


                            await updateBlock(
                                blockId,
                                yText.toString()
                            );


                        } catch (
                        error
                        ) {

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
    // SAVE VERSION
    // =========================================

    const handleCreateVersion = async () => {

        try {

            await createVersion(
                DOCUMENT_ID
            );

            const data =
                await getVersions(
                    DOCUMENT_ID
                );

            setVersions(
                data.versions
            );

            console.log(
                "VERSION CREATED"
            );

        } catch (error) {

            console.error(
                "FAILED TO CREATE VERSION:",
                error
            );

        }

    };


    // =========================================
    // LOAD VERSION HISTORY
    // =========================================

    const handleShowVersions =
        async () => {

            try {

                const data =
                    await getVersions(
                        DOCUMENT_ID
                    );

                setVersions(
                    data.versions
                );

                setShowVersions(
                    true
                );

            } catch (error) {

                console.error(
                    "FAILED TO LOAD VERSIONS:",
                    error
                );

            }

        };


    // =========================================
    // RESTORE VERSION
    // =========================================

    const handleRestoreVersion =
        async (
            versionId
        ) => {

            try {

                await restoreVersion(
                    DOCUMENT_ID,
                    versionId
                );


                // Reload document
                const data =
                    await getDocument(
                        DOCUMENT_ID
                    );


                setDocument(
                    data.document
                );


                console.log(
                    "VERSION RESTORED"
                );

            } catch (error) {

                console.error(
                    "FAILED TO RESTORE VERSION:",
                    error
                );

            }

        };


    // =========================================
    // UNDO
    // =========================================

    const handleUndo =
        () => {

            const connection =
                yjsRef.current;


            if (
                !connection ||
                !connection.undoManager
            ) {

                return;

            }


            if (
                connection.undoManager.canUndo()
            ) {

                connection.undoManager.undo();

            }

        };


    // =========================================
    // REDO
    // =========================================

    const handleRedo =
        () => {

            const connection =
                yjsRef.current;


            if (
                !connection ||
                !connection.undoManager
            ) {

                return;

            }


            if (
                connection.undoManager.canRedo()
            ) {

                connection.undoManager.redo();

            }

        };


    // =========================================
    // RENDER AST BLOCK
    // =========================================

    const renderBlock =
        (
            block,
            depth = 0
        ) => {

            const yBlock =
                yjsRef.current
                    ?.blocks
                    .get(
                        block._id
                    );


            return (

                <div
                    key={
                        block._id
                    }

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

                    <EditableBlock

                        draggable={
                            true
                        }

                        onDragStart={
                            (
                                event
                            ) =>
                                handleDragStart(
                                    event,
                                    block._id
                                )
                        }

                        onDragOver={
                            handleDragOver
                        }

                        onDrop={
                            (
                                event
                            ) =>
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
                    {/* CHILDREN */}
                    {/* ================================= */}

                    {
                        block.children &&
                        block.children.length > 0 &&
                        (

                            <div
                                style={{
                                    marginTop:
                                        "10px"
                                }}
                            >

                                {
                                    block.children.map(
                                        (
                                            child
                                        ) => {

                                            const childId =
                                                typeof child ===
                                                    "object"
                                                    ? child._id
                                                    : child;


                                            const childBlock =
                                                document.blocks.find(
                                                    (
                                                        item
                                                    ) =>
                                                        String(
                                                            item._id
                                                        ) ===
                                                        String(
                                                            childId
                                                        )
                                                );


                                            if (
                                                !childBlock
                                            ) {

                                                return null;

                                            }


                                            return renderBlock(
                                                childBlock,
                                                depth + 1
                                            );

                                        }
                                    )
                                }

                            </div>

                        )
                    }

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

            <h1>
                {document.title}
            </h1>


            {/* ========================================= */}
            {/* TOOLBAR */}
            {/* ========================================= */}

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
                <button
                    onClick={
                        handleCreateVersion
                    }
                >
                    💾 Save Version
                </button>

                <button
                    onClick={
                        handleShowVersions
                    }
                >
                    🕒 Version History
                </button>

            </div>
            {showVersions && (

    <div
        style={{
            marginBottom: "20px",
            padding: "15px",
            background: "#111827",
            color: "white",
            borderRadius: "8px"
        }}
    >

        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px"
            }}
        >

            <strong>
                Version History
            </strong>

            <button
                onClick={() =>
                    setShowVersions(false)
                }
            >
                Close
            </button>

        </div>


        {versions.length === 0 ? (

            <p>
                No saved versions yet.
            </p>

        ) : (

            versions.map(
                (version) => (

                    <div
                        key={
                            version._id
                        }
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px",
                            marginBottom: "6px",
                            background: "#1f2937",
                            borderRadius: "6px"
                        }}
                    >

                        <span>
                            Version{" "}
                            {version.versionNumber}
                            {" — "}
                            {
                                new Date(
                                    version.createdAt
                                ).toLocaleString()
                            }
                        </span>


                        <button
                            onClick={() =>
                                handleRestoreVersion(
                                    version._id
                                )
                            }
                        >
                            Restore
                        </button>

                    </div>

                )
            )

        )}

    </div>

)}


            {/* ========================================= */}
            {/* CURRENT USER */}
            {/* ========================================= */}

            <div
                style={{

                    marginBottom:
                        "10px",

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


            {/* ========================================= */}
            {/* CONNECTION STATUS */}
            {/* ========================================= */}

            <div
                style={{

                    marginBottom:
                        "15px",

                    padding:
                        "8px 12px",

                    borderRadius:
                        "8px",

                    width:
                        "fit-content",

                    background:
                        connectionStatus ===
                            "connected"

                            ? "#14532d"

                            : connectionStatus ===
                                "connecting"

                                ? "#854d0e"

                                : "#7f1d1d",

                    color:
                        "white",

                    fontWeight:
                        "bold"

                }}
            >

                {
                    connectionStatus ===
                    "connected" &&
                    "🟢 Connected"
                }

                {
                    connectionStatus ===
                    "connecting" &&
                    "🟡 Connecting..."
                }

                {
                    connectionStatus ===
                    "disconnected" &&
                    "🔴 Disconnected"
                }

            </div>


            {/* ========================================= */}
            {/* ONLINE USERS */}
            {/* ========================================= */}

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


                {
                    onlineUsers.map(
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

                                {
                                    user.name
                                }

                            </span>

                        )
                    )
                }

            </div>


            {/* ========================================= */}
            {/* ROOT DROP ZONE */}
            {/* ========================================= */}

            <div
                onDragOver={
                    handleDragOver
                }

                onDrop={
                    (event) => {

                        event.preventDefault();

                        const blockId =
                            event.dataTransfer.getData(
                                "text/plain"
                            );

                        if (
                            blockId
                        ) {

                            handleMoveToRoot(
                                blockId
                            );

                        }

                    }
                }

                style={{
                    marginBottom:
                        "20px",

                    padding:
                        "12px",

                    border:
                        "2px dashed #374151",

                    borderRadius:
                        "8px",

                    color:
                        "#9ca3af",

                    textAlign:
                        "center"
                }}
            >

                Drop here to move block to root

            </div>


            {/* ========================================= */}
            {/* AST DOCUMENT */}
            {/* ========================================= */}

            <div>

                {
                    document.blocks
                        .filter(
                            (
                                block
                            ) =>
                                !block.parentId
                        )
                        .map(
                            (
                                block
                            ) =>
                                renderBlock(
                                    block,
                                    0
                                )
                        )
                }

            </div>

        </div>

    );

}


export default Editor;