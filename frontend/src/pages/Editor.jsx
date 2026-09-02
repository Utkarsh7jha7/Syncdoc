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

import "./Editor.css";


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

    const blockObserversRef =
        useRef(new Map());


    // =========================================
    // OBSERVE YJS BLOCK
    // =========================================

    const observeYBlock = (
        blockId,
        yBlock
    ) => {

        if (!yBlock) {
            return;
        }


        if (
            blockObserversRef.current.has(
                blockId
            )
        ) {
            return;
        }


        const observer = (
            event
        ) => {

            const changedKeys =
                Array.from(
                    event.keysChanged
                );


            if (
                !changedKeys.includes(
                    "parentId"
                ) &&
                !changedKeys.includes(
                    "children"
                )
            ) {

                return;
            }


            const newParentId =
                yBlock.get(
                    "parentId"
                ) || null;


            const newChildren =
                yBlock.get(
                    "children"
                ) || [];


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
                                            block &&
                                            String(
                                                block._id
                                            ) ===
                                            String(
                                                blockId
                                            )
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
                }
            );

        };


        yBlock.observe(
            observer
        );


        blockObserversRef.current.set(
            blockId,
            observer
        );

    };


    // =========================================
    // LOAD DOCUMENT + YJS
    // =========================================

    useEffect(() => {

        let connection =
            null;

        let updateOnlineUsers =
            null;

        let handleBlocksChange =
            null;


        const loadDocument =
            async () => {

                try {

                    console.log(
                        "LOADING DOCUMENT..."
                    );


                    const data =
                        await getDocument(
                            DOCUMENT_ID
                        );


                    console.log(
                        "DOCUMENT RECEIVED:",
                        data
                    );


                    if (
                        !data ||
                        !data.document
                    ) {

                        setDocument(
                            null
                        );

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
                            (
                                status
                            ) => {

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
                            // ACTIVE EDITING USERS
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
                        (
                            event
                        ) => {

                            event.changes.keys.forEach(
                                (
                                    change,
                                    blockId
                                ) => {

                                    // =============================
                                    // ADD BLOCK
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

                                            children:
                                                yBlock.get(
                                                    "children"
                                                ) ||
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
                                                                block &&
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
                                                                    block &&
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

                        console.log(
                            "INITIALIZING YJS BLOCKS"
                        );


                        (
                            data.document.blocks ||
                            []
                        ).forEach(
                            (
                                block
                            ) => {

                                if (
                                    !block ||
                                    !block._id
                                ) {
                                    return;
                                }


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


                blockObserversRef.current.forEach(
                    (
                        observer,
                        blockId
                    ) => {

                        const yBlock =
                            connection.blocks.get(
                                blockId
                            );


                        if (
                            yBlock
                        ) {

                            yBlock.unobserve(
                                observer
                            );

                        }

                    }
                );


                blockObserversRef.current.clear();


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
                    !connection ||
                    !newBlock
                ) {

                    console.error(
                        "YJS CONNECTION NOT AVAILABLE"
                    );

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

                if (
                    !document
                ) {
                    return;
                }


                const block =
                    document.blocks.find(
                        (
                            item
                        ) =>
                            item &&
                            String(
                                item._id
                            ) ===
                            String(
                                blockId
                            )
                    );


                // =================================
                // REMOVE FROM PARENT
                // =================================

                if (
                    block?.parentId
                ) {

                    const parent =
                        document.blocks.find(
                            (
                                item
                            ) =>
                                item &&
                                String(
                                    item._id
                                ) ===
                                String(
                                    block.parentId
                                )
                        );


                    if (
                        parent
                    ) {

                        const children =
                            (
                                parent.children ||
                                []
                            )
                                .map(
                                    (
                                        child
                                    ) =>
                                        typeof child ===
                                        "object"
                                            ? child._id
                                            : child
                                )
                                .filter(
                                    (
                                        childId
                                    ) =>
                                        String(
                                            childId
                                        ) !==
                                        String(
                                            blockId
                                        )
                                );


                        await updateBlockChildren(
                            block.parentId,
                            children
                        );

                    }

                }


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
    // IS DESCENDANT
    // =========================================

    const isDescendant =
        (
            parentId,
            possibleChildId,
            visited = new Set()
        ) => {

            if (
                !document
            ) {
                return false;
            }


            const parentKey =
                String(
                    parentId
                );


            if (
                visited.has(
                    parentKey
                )
            ) {

                return false;

            }


            visited.add(
                parentKey
            );


            const parent =
                document.blocks.find(
                    (
                        block
                    ) =>
                        block &&
                        String(
                            block._id
                        ) ===
                        parentKey
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
                        possibleChildId,
                        visited
                    )
                ) {

                    return true;

                }

            }


            return false;

        };


    // =========================================
    // UPDATE YJS AST RELATIONSHIP
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

            try {

                if (
                    !document
                ) {
                    return;
                }


                const sourceBlock =
                    document.blocks.find(
                        (
                            block
                        ) =>
                            block &&
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
                        (
                            block
                        ) =>
                            block &&
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
                                (
                                    child
                                ) =>
                                    typeof child ===
                                    "object"
                                        ? child._id
                                        : child
                            )
                            .filter(
                                (
                                    childId
                                ) =>
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
                // UPDATE SOURCE
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
                // ROOT ORDER
                // =================================

                const rootIds =
                    document.blocks
                        .filter(
                            (
                                block
                            ) => {

                                return (
                                    block &&
                                    !block.parentId &&
                                    String(
                                        block._id
                                    ) !==
                                    String(
                                        sourceBlockId
                                    )
                                );

                            }
                        )
                        .map(
                            (
                                block
                            ) =>
                                block._id
                        );


                rootIds.push(
                    sourceBlockId
                );


                await reorderBlocks(
                    DOCUMENT_ID,
                    rootIds
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
                                                !block
                                            ) {
                                                return block;
                                            }


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
                    null,
                    [],
                    oldParentId,
                    oldParentChildren
                );


                setDraggedBlockId(
                    null
                );


            } catch (
                error
            ) {

                console.error(
                    "FAILED TO MOVE BLOCK TO ROOT:",
                    error
                );


                setDraggedBlockId(
                    null
                );

            }

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
                String(
                    sourceBlockId
                ) ===
                String(
                    targetBlockId
                )
            ) {

                setDraggedBlockId(
                    null
                );

                return;

            }


            if (
                !document
            ) {

                setDraggedBlockId(
                    null
                );

                return;

            }


            const sourceBlock =
                document.blocks.find(
                    (
                        block
                    ) =>
                        block &&
                        String(
                            block._id
                        ) ===
                        String(
                            sourceBlockId
                        )
                );


            const targetBlock =
                document.blocks.find(
                    (
                        block
                    ) =>
                        block &&
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


            // =================================
            // PREVENT CIRCULAR AST
            // =================================

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


            const oldParentId =
                sourceBlock.parentId ||
                null;


            let oldParentChildren =
                [];


            // =================================
            // REMOVE FROM OLD PARENT
            // =================================

            if (
                oldParentId
            ) {

                const oldParent =
                    document.blocks.find(
                        (
                            block
                        ) =>
                            block &&
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
                                (
                                    child
                                ) =>
                                    typeof child ===
                                    "object"
                                        ? child._id
                                        : child
                            )
                            .filter(
                                (
                                    childId
                                ) =>
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
            // NEW PARENT CHILDREN
            // =================================

            const targetChildren =
                (
                    targetBlock.children ||
                    []
                )
                    .map(
                        (
                            child
                        ) =>
                            typeof child ===
                            "object"
                                ? child._id
                                : child
                    )
                    .filter(
                        (
                            childId
                        ) =>
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
            // REMOVE SOURCE FROM ROOT ORDER
            // =================================

            const newRootIds =
                document.blocks
                    .filter(
                        (
                            block
                        ) => {

                            return (
                                block &&
                                !block.parentId &&
                                String(
                                    block._id
                                ) !==
                                String(
                                    sourceBlockId
                                )
                            );

                        }
                    )
                    .map(
                        (
                            block
                        ) =>
                            block._id
                    );


            await reorderBlocks(
                DOCUMENT_ID,
                newRootIds
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
                                            !block
                                        ) {
                                            return block;
                                        }


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
                                            !block
                                        ) {
                                            return block;
                                        }


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
    // CREATE VERSION
    // =========================================

    const handleCreateVersion =
        async () => {

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


                setShowVersions(
                    true
                );


                console.log(
                    "VERSION CREATED"
                );


            } catch (
                error
            ) {

                console.error(
                    "FAILED TO CREATE VERSION:",
                    error
                );

            }

        };


    // =========================================
    // SHOW VERSIONS
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


            } catch (
                error
            ) {

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

                const result =
                    await restoreVersion(
                        DOCUMENT_ID,
                        versionId
                    );


                console.log(
                    "VERSION RESTORED:",
                    result
                );


                const data =
                    await getDocument(
                        DOCUMENT_ID
                    );


                setDocument(
                    data.document
                );


                // =================================
                // REBUILD YJS STATE
                // =================================

                const connection =
                    yjsRef.current;


                if (
                    connection
                ) {

                    connection.blocks.forEach(
                        (
                            yBlock,
                            blockId
                        ) => {

                            connection.blocks.delete(
                                blockId
                            );

                        }
                    );


                    (
                        data.document.blocks ||
                        []
                    ).forEach(
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


                            connection.blocks.set(
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

                }


                setShowVersions(
                    false
                );


            } catch (
                error
            ) {

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
                !connection.undoManager.canUndo()
            ) {

                console.log(
                    "NOTHING TO UNDO"
                );

                return;

            }


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
                !connection ||
                !connection.undoManager
            ) {
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


            connection.undoManager.redo();

        };


    // =========================================
    // RENDER BLOCK
    // =========================================

    const renderStyledBlock =
        (
            block,
            depth = 0,
            visited = new Set()
        ) => {

            // =================================
            // SAFETY CHECK
            // =================================

            if (
                !block ||
                !block._id
            ) {

                return null;

            }


            const blockKey =
                String(
                    block._id
                );


            // Prevent infinite AST recursion
            if (
                visited.has(
                    blockKey
                )
            ) {

                console.warn(
                    "CIRCULAR AST DETECTED:",
                    blockKey
                );

                return null;

            }


            const nextVisited =
                new Set(
                    visited
                );


            nextVisited.add(
                blockKey
            );


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

                    className="syncdoc-block-wrapper"

                    style={{
                        marginLeft:
                            `${depth * 30}px`
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
                                className="syncdoc-block-children"
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
                                                (
                                                    document.blocks ||
                                                    []
                                                ).find(
                                                    (
                                                        item
                                                    ) =>
                                                        item &&
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


                                            return renderStyledBlock(
                                                childBlock,
                                                depth + 1,
                                                nextVisited
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
            <div
                className="syncdoc-editor"
            >

                <div
                    className="syncdoc-main"
                >

                    <div
                        className="syncdoc-content"
                    >

                        <h2>
                            Loading document...
                        </h2>

                    </div>

                </div>

            </div>
        );

    }


    // =========================================
    // DOCUMENT NOT FOUND
    // =========================================

    if (
        !document
    ) {

        return (
            <div
                className="syncdoc-editor"
            >

                <div
                    className="syncdoc-main"
                >

                    <div
                        className="syncdoc-content"
                    >

                        <h2>
                            Document not found
                        </h2>

                    </div>

                </div>

            </div>
        );

    }


    // =========================================
    // UI
    // =========================================

    return (

        <div
            className="syncdoc-editor"
        >

            {/* ================================= */}
            {/* TOP BAR */}
            {/* ================================= */}

            <header
                className="syncdoc-topbar"
            >

                <div
                    className="syncdoc-brand"
                >

                    <button
                        className="syncdoc-menu"
                        type="button"
                    >
                        ☰
                    </button>


                    <span
                        className="syncdoc-document-icon"
                    >
                        ▣
                    </span>


                    <h1
                        className="syncdoc-title"
                    >
                        {document.title}
                    </h1>

                </div>


                <div
                    className={
                        `syncdoc-status ${
                            connectionStatus
                        }`
                    }
                >

                    <div
                        className="syncdoc-status-dot"
                    />


                    <span>

                        {
                            connectionStatus ===
                            "connected"

                                ? "Connected"

                                : connectionStatus ===
                                  "connecting"

                                    ? "Connecting..."

                                    : "Disconnected"
                        }

                    </span>

                </div>

            </header>


            {/* ================================= */}
            {/* ACTIVE USERS */}
            {/* ================================= */}

            <div
                className="syncdoc-presence"
            >

                <div
                    className="syncdoc-active-label"
                >

                    <span>
                        ♡
                    </span>

                    ACTIVE

                </div>


                {
                    onlineUsers.map(
                        (
                            user,
                            index
                        ) => {

                            const isCurrentUser =
                                user.name ===
                                currentUser;


                            return (

                                <div
                                    key={
                                        user.name +
                                        index
                                    }

                                    className={
                                        `syncdoc-user-pill ${
                                            isCurrentUser
                                                ? "current"
                                                : ""
                                        }`
                                    }
                                >

                                    <div
                                        className="syncdoc-avatar"
                                    >

                                        {
                                            user.name
                                                ?.charAt(
                                                    0
                                                )
                                                .toUpperCase()
                                        }

                                    </div>


                                    <div
                                        className="syncdoc-online-dot"
                                    />


                                    {
                                        user.name
                                    }

                                </div>

                            );

                        }
                    )
                }

            </div>


            {/* ================================= */}
            {/* MAIN */}
            {/* ================================= */}

            <main
                className="syncdoc-main"
            >

                <div
                    className="syncdoc-content"
                >

                    {/* ================================= */}
                    {/* DOCUMENT DESCRIPTION */}
                    {/* ================================= */}

                    <div
                        className="syncdoc-description"
                    >

                        This specification details the
                        architecture and implementation
                        guidelines for the real-time
                        collaboration engine.

                    </div>


                    {/* ================================= */}
                    {/* VERSION HISTORY */}
                    {/* ================================= */}

                    {
                        showVersions && (

                            <div
                                className="syncdoc-version-panel"
                            >

                                <div
                                    className="syncdoc-version-header"
                                >

                                    <span>
                                        Version History
                                    </span>


                                    <button
                                        className="syncdoc-version-restore"

                                        onClick={() =>
                                            setShowVersions(
                                                false
                                            )
                                        }
                                    >

                                        Close

                                    </button>

                                </div>


                                {
                                    versions.length ===
                                    0 ? (

                                        <div>
                                            No saved versions yet.
                                        </div>

                                    ) : (

                                        versions.map(
                                            (
                                                version
                                            ) => (

                                                <div
                                                    key={
                                                        version._id
                                                    }

                                                    className="syncdoc-version-item"
                                                >

                                                    <span>

                                                        Version{" "}

                                                        {
                                                            version.versionNumber
                                                        }

                                                        {" · "}

                                                        {
                                                            new Date(
                                                                version.createdAt
                                                            )
                                                                .toLocaleString()
                                                        }

                                                    </span>


                                                    <button
                                                        className="syncdoc-version-restore"

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

                                    )
                                }

                            </div>

                        )
                    }


                    {/* ================================= */}
                    {/* ROOT DROP ZONE */}
                    {/* ================================= */}

                    <div
                        className="syncdoc-root-dropzone"

                        onDragOver={
                            handleDragOver
                        }

                        onDrop={
                            (
                                event
                            ) => {

                                event.preventDefault();


                                const blockId =
                                    event.dataTransfer
                                        .getData(
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
                    >

                        Drop block here to move it to root

                    </div>


                    {/* ================================= */}
                    {/* AST DOCUMENT */}
                    {/* ================================= */}

                    <div>

                        {
                            (
                                document.blocks ||
                                []
                            )
                                .filter(
                                    (
                                        block
                                    ) =>
                                        block &&
                                        block._id &&
                                        !block.parentId
                                )
                                .map(
                                    (
                                        block
                                    ) =>
                                        renderStyledBlock(
                                            block,
                                            0
                                        )
                                )
                        }

                    </div>

                </div>

            </main>


            {/* ================================= */}
            {/* BOTTOM TOOLBAR */}
            {/* ================================= */}

            <div
                className="syncdoc-toolbar"
            >

                <div
                    className="syncdoc-toolbar-group"
                >

                    <button
                        className="syncdoc-tool"

                        title="Paragraph"

                        onClick={() =>
                            handleAddBlock(
                                "paragraph"
                            )
                        }
                    >
                        ≡
                    </button>


                    <button
                        className="syncdoc-tool"

                        title="Heading"

                        onClick={() =>
                            handleAddBlock(
                                "heading"
                            )
                        }
                    >
                        H1
                    </button>


                    <button
                        className="syncdoc-tool"

                        title="Bullet"

                        onClick={() =>
                            handleAddBlock(
                                "bullet"
                            )
                        }
                    >
                        ☷
                    </button>

                </div>


                <div
                    className="syncdoc-toolbar-divider"
                />


                <button
                    className="syncdoc-tool active"

                    title="Code"

                    onClick={() =>
                        handleAddBlock(
                            "code"
                        )
                    }
                >
                    {"</>"}
                </button>


                <div
                    className="syncdoc-toolbar-divider"
                />


                <button
                    className="syncdoc-tool"

                    title="Undo"

                    onClick={
                        handleUndo
                    }
                >
                    ↶
                </button>


                <button
                    className="syncdoc-tool"

                    title="Redo"

                    onClick={
                        handleRedo
                    }
                >
                    ↷
                </button>


                <div
                    className="syncdoc-toolbar-spacer"
                />


                <button
                    className="syncdoc-tool"

                    title="Version History"

                    onClick={
                        handleShowVersions
                    }
                >
                    ◷
                </button>


                <button
                    className="syncdoc-save"

                    onClick={
                        handleCreateVersion
                    }
                >

                    💾 SAVE

                </button>

            </div>

        </div>

    );

}


export default Editor;