import {
    getDocument,
    updateBlock,
    createBlock,
    deleteBlock,
    updateBlockChildren,
    reorderBlocks
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

    const [onlineUsers, setOnlineUsers] =
        useState([]);

    const [activeUsers, setActiveUsers] =
        useState({});

    const [draggedBlockId, setDraggedBlockId] =
        useState(null);

    const [connectionStatus, setConnectionStatus] =
        useState("connecting");

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

        let updateOnlineUsers = null;

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

                    connection = createYjsConnection(
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


                            console.log(
                                "ONLINE USERS:",
                                users
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
                    // YJS BLOCK ADD / DELETE
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
                                                ) || []

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
                            "INITIALIZING YJS FROM MONGODB"
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


                                connection
                                    .registerTextForUndo(
                                        yText
                                    );

                            }
                        );

                    } else {

                        // =================================
                        // REGISTER EXISTING TEXT
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


                // =================================
                // CREATE IN MONGODB
                // =================================

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


                yBlock.set(
                    "parentId",
                    newBlock.parentId ||
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


                // =================================
                // REGISTER UNDO
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
    // DROP BLOCK
    // =========================================

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

        // -----------------------------------------
        // INVALID DROP
        // -----------------------------------------

        if (
            !sourceBlockId ||
            sourceBlockId === targetBlockId
        ) {

            setDraggedBlockId(null);

            return;
        }


        if (!document) {

            setDraggedBlockId(null);

            return;
        }


        const sourceBlock =
            document.blocks.find(
                (block) =>
                    String(block._id) ===
                    String(sourceBlockId)
            );


        const targetBlock =
            document.blocks.find(
                (block) =>
                    String(block._id) ===
                    String(targetBlockId)
            );


        if (
            !sourceBlock ||
            !targetBlock
        ) {

            setDraggedBlockId(null);

            return;
        }


        // -----------------------------------------
        // PREVENT CIRCULAR AST
        // -----------------------------------------

        const isDescendant = (
            parentId,
            possibleChildId
        ) => {

            const parent =
                document.blocks.find(
                    (block) =>
                        String(block._id) ===
                        String(parentId)
                );


            if (!parent) {
                return false;
            }


            const children =
                parent.children || [];


            for (
                const child of children
            ) {

                const childId =
                    typeof child === "object"
                        ? child._id
                        : child;


                if (
                    String(childId) ===
                    String(possibleChildId)
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


        // Don't allow:
        //
        // A
        //  └── B
        //
        // B → A
        //
        if (
            isDescendant(
                sourceBlockId,
                targetBlockId
            )
        ) {

            console.warn(
                "Cannot create circular AST"
            );

            setDraggedBlockId(null);

            return;
        }


        // -----------------------------------------
        // CURRENT PARENT OF SOURCE
        // -----------------------------------------

        const oldParentId =
            sourceBlock.parentId || null;


        // -----------------------------------------
        // REMOVE SOURCE FROM OLD PARENT
        // -----------------------------------------

        if (oldParentId) {

            const oldParent =
                document.blocks.find(
                    (block) =>
                        String(block._id) ===
                        String(oldParentId)
                );


            if (oldParent) {

                const oldChildren =
                    (
                        oldParent.children ||
                        []
                    );


                const updatedOldChildren =
                    oldChildren
                        .map(
                            (child) =>
                                typeof child ===
                                    "object"
                                    ? child._id
                                    : child
                        )
                        .filter(
                            (childId) =>
                                String(childId) !==
                                String(sourceBlockId)
                        );


                await updateBlockChildren(
                    oldParentId,
                    updatedOldChildren
                );

            }

        }


        // -----------------------------------------
        // ADD SOURCE TO TARGET CHILDREN
        // -----------------------------------------

        const targetChildren =
            (
                targetBlock.children ||
                []
            )
                .map(
                    (child) =>
                        typeof child === "object"
                            ? child._id
                            : child
                )
                .filter(
                    (childId) =>
                        String(childId) !==
                        String(sourceBlockId)
                );


        targetChildren.push(
            sourceBlockId
        );


        // -----------------------------------------
        // UPDATE TARGET CHILDREN
        // -----------------------------------------

        await updateBlockChildren(
            targetBlockId,
            targetChildren
        );


        // -----------------------------------------
        // UPDATE SOURCE PARENT
        // -----------------------------------------

        const sourceResponse =
            await fetch(
                `http://localhost:5000/api/blocks/${sourceBlockId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        parentId:
                            targetBlockId
                    })
                }
            );


        if (
            !sourceResponse.ok
        ) {

            throw new Error(
                "Failed to update block parent"
            );

        }


        // -----------------------------------------
        // UPDATE LOCAL STATE
        // -----------------------------------------

        setDocument(
            (previousDocument) => {

                if (
                    !previousDocument
                ) {

                    return previousDocument;
                }


                return {

                    ...previousDocument,

                    blocks:
                        previousDocument.blocks.map(
                            (block) => {

                                // SOURCE BLOCK
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


                                // TARGET BLOCK
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


                                // OLD PARENT
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
                                            (
                                                block.children ||
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

                                    };

                                }


                                return block;

                            }
                        )

                };

            }
        );


        // -----------------------------------------
        // UPDATE YJS
        // -----------------------------------------

        const connection =
            yjsRef.current;


        if (connection) {

            const sourceYBlock =
                connection.blocks.get(
                    sourceBlockId
                );


            const targetYBlock =
                connection.blocks.get(
                    targetBlockId
                );


            if (
                sourceYBlock
            ) {

                sourceYBlock.set(
                    "parentId",
                    targetBlockId
                );

            }


            if (
                targetYBlock
            ) {

                targetYBlock.set(
                    "children",
                    targetChildren
                );

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

                    const oldChildren =
                        (
                            oldParentYBlock.get(
                                "children"
                            ) ||
                            []
                        )
                            .filter(
                                (childId) =>
                                    String(childId) !==
                                    String(sourceBlockId)
                            );


                    oldParentYBlock.set(
                        "children",
                        oldChildren
                    );

                }

            }

        }


        setDraggedBlockId(
            null
        );


        console.log(
            "AST NESTING UPDATED:",
            sourceBlockId,
            "→",
            targetBlockId
        );

    };

    // =========================================
    // ADD BLOCK AS CHILD
    // =========================================

    const handleAddChild =
        async (
            parentId,
            childId
        ) => {

            try {

                if (
                    String(parentId) ===
                    String(childId)
                ) {

                    return;

                }


                const parentBlock =
                    document.blocks.find(
                        (
                            block
                        ) =>
                            String(
                                block._id
                            ) ===
                            String(
                                parentId
                            )
                    );


                const childBlock =
                    document.blocks.find(
                        (
                            block
                        ) =>
                            String(
                                block._id
                            ) ===
                            String(
                                childId
                            )
                    );


                if (
                    !parentBlock ||
                    !childBlock
                ) {

                    return;

                }


                // =================================
                // PREVENT CIRCULAR HIERARCHY
                // =================================

                const isDescendant =
                    (
                        candidateId,
                        targetId
                    ) => {

                        const candidate =
                            document.blocks.find(
                                (
                                    block
                                ) =>
                                    String(
                                        block._id
                                    ) ===
                                    String(
                                        candidateId
                                    )
                            );


                        if (
                            !candidate
                        ) {

                            return false;

                        }


                        const children =
                            candidate.children ||
                            [];


                        for (
                            const child
                            of children
                        ) {

                            const id =
                                typeof child ===
                                    "object"
                                    ? child._id
                                    : child;


                            if (
                                String(id) ===
                                String(targetId)
                            ) {

                                return true;

                            }


                            if (
                                isDescendant(
                                    id,
                                    targetId
                                )
                            ) {

                                return true;

                            }

                        }


                        return false;

                    };


                if (
                    isDescendant(
                        childId,
                        parentId
                    )
                ) {

                    console.warn(
                        "CANNOT CREATE CIRCULAR AST"
                    );

                    return;

                }


                // =================================
                // EXISTING CHILDREN
                // =================================

                const currentChildren =
                    parentBlock.children ||
                    [];


                const childAlreadyExists =
                    currentChildren.some(
                        (
                            child
                        ) => {

                            const id =
                                typeof child ===
                                    "object"
                                    ? child._id
                                    : child;


                            return (
                                String(id) ===
                                String(childId)
                            );

                        }
                    );


                if (
                    childAlreadyExists
                ) {

                    return;

                }


                const updatedChildren =
                    [
                        ...currentChildren.map(
                            (
                                child
                            ) =>
                                typeof child ===
                                    "object"
                                    ? child._id
                                    : child
                        ),

                        childId
                    ];


                // =================================
                // UPDATE PARENT
                // =================================

                await updateBlockChildren(
                    parentId,
                    updatedChildren
                );


                // =================================
                // UPDATE CHILD
                // =================================

                const childResponse =
                    await fetch(
                        `http://localhost:5000/api/blocks/${childId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                parentId
                            })
                        }
                    );


                if (
                    !childResponse.ok
                ) {

                    throw new Error(
                        "Failed to update child parent"
                    );

                }


                // =================================
                // UPDATE YJS
                // =================================

                const connection =
                    yjsRef.current;


                if (
                    connection
                ) {

                    const parentYBlock =
                        connection.blocks.get(
                            parentId
                        );


                    if (
                        parentYBlock
                    ) {

                        parentYBlock.set(
                            "children",
                            updatedChildren
                        );

                    }


                    const childYBlock =
                        connection.blocks.get(
                            childId
                        );


                    if (
                        childYBlock
                    ) {

                        childYBlock.set(
                            "parentId",
                            parentId
                        );

                    }

                }


                // =================================
                // UPDATE REACT STATE
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
                                                    parentId
                                                )
                                            ) {

                                                return {

                                                    ...block,

                                                    children:
                                                        updatedChildren

                                                };

                                            }


                                            if (
                                                String(
                                                    block._id
                                                ) ===
                                                String(
                                                    childId
                                                )
                                            ) {

                                                return {

                                                    ...block,

                                                    parentId

                                                };

                                            }


                                            return block;

                                        }
                                    )

                        };

                    }
                );


                console.log(
                    "AST RELATIONSHIP CREATED:",
                    parentId,
                    "→",
                    childId
                );


            } catch (
            error
            ) {

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

            // =================================
            // UPDATE REACT STATE
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


            // =================================
            // DEBOUNCE SAVE
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


                            const mergedContent =
                                yText.toString();


                            await updateBlock(
                                blockId,
                                mergedContent
                            );


                            console.log(
                                "MERGED BLOCK SAVED:",
                                blockId
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
                    {/* AST CHILD BUTTON */}
                    {/* ================================= */}

                    {document.blocks.some(
                        (
                            candidate
                        ) =>
                            String(
                                candidate._id
                            ) !==
                            String(
                                block._id
                            )
                    ) && (

                            <button

                                onClick={() => {

                                    const child =
                                        document.blocks.find(
                                            (
                                                candidate
                                            ) =>
                                                String(
                                                    candidate._id
                                                ) !==
                                                String(
                                                    block._id
                                                )
                                        );


                                    if (
                                        child
                                    ) {

                                        handleAddChild(
                                            block._id,
                                            child._id
                                        );

                                    }

                                }}

                                style={{
                                    marginTop:
                                        "5px",

                                    marginBottom:
                                        "10px",

                                    padding:
                                        "5px 10px",

                                    background:
                                        "#2563eb",

                                    color:
                                        "white",

                                    border:
                                        "none",

                                    borderRadius:
                                        "5px",

                                    cursor:
                                        "pointer"
                                }}
                            >

                                + Make another block a child

                            </button>

                        )}


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
                    marginBottom: "20px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    width: "fit-content",
                    background:
                        connectionStatus === "connected"
                            ? "#14532d"
                            : connectionStatus === "connecting"
                                ? "#854d0e"
                                : "#7f1d1d",
                    color: "white",
                    fontWeight: "bold"
                }}
            >
                {connectionStatus === "connected" && "🟢 Connected"}

                {connectionStatus === "connecting" && "🟡 Connecting..."}

                {connectionStatus === "disconnected" && "🔴 Disconnected"}
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
            {/* AST DOCUMENT */}
            {/* ================================= */}

            <div>

                {document.blocks
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
                    )}

            </div>

        </div>

    );

}


export default Editor;