import {
    getDocument,
    updateBlock,
    createBlock
} from "../services/documentService";

import EditableBlock from "../components/EditableBlock";
import { useEffect, useRef, useState } from "react";
import { createYjsConnection } from "../services/yjsService";
import * as Y from "yjs";
import {
    getCurrentUser
} from "../services/userService";

const DOCUMENT_ID = "6a7c775e1e1354cef663ebc5";

function Editor() {


    console.log("EDITOR COMPONENT IS RUNNING");
    const currentUser = getCurrentUser();

    console.log(
        "Current user:",
        currentUser
    );
const [document, setDocument] = useState(null);
const [loading, setLoading] = useState(true);
const [onlineUsers, setOnlineUsers] = useState([]);
const [activeUsers, setActiveUsers] = useState({});

    const saveTimers = useRef({});
    const yjsRef = useRef(null);

    useEffect(() => {

        console.log("USE EFFECT IS RUNNING");

        const loadDocument = async () => {

            console.log("LOAD DOCUMENT FUNCTION STARTED");

            try {

                console.log("CALLING API...");

                const data = await getDocument(DOCUMENT_ID);

                console.log("API RESPONSE:", data);

                setDocument(data.document);

                console.log("DOCUMENT SET");

const connection = createYjsConnection(
    DOCUMENT_ID,
    currentUser
);
                console.log("YJS CONNECTION CREATED");

yjsRef.current = connection;

console.log(
    "CURRENT USER:",
    currentUser
);

console.log(
    "AWARENESS STATE:",
    connection.awareness.getStates()
);
const handleAddBlock = async (type) => {

    try {

        let blockData = {
            type,
            content: "",
            level: type === "heading" ? 2 : 0,
            language: type === "code"
                ? "javascript"
                : null
        };

        console.log(
            "Creating block:",
            blockData
        );

        const data =
            await createBlock(blockData);

        console.log(
            "Block created:",
            data
        );

        const newBlock =
            data.block;

        setDocument((previousDocument) => ({
            ...previousDocument,

            blocks: [
                ...previousDocument.blocks,
                newBlock
            ]
        }));

    } catch (error) {

        console.error(
            "Failed to create block:",
            error
        );

    }
};

// =========================================
// LISTEN FOR ONLINE USERS
// =========================================

const updateOnlineUsers = () => {

    const states =
        Array.from(
            connection.awareness
                .getStates()
                .values()
        );

    const users = states
        .map((state) => state.user)
        .filter(Boolean);

    console.log(
        "ONLINE USERS:",
        users
    );

    setOnlineUsers(users);
};

connection.awareness.on(
    "change",
    updateOnlineUsers
);

// Get initial users
updateOnlineUsers();

                const { blocks } = connection;
                // =========================================
// LISTEN FOR NEW / DELETED BLOCKS
// =========================================

const handleBlocksChange = (event) => {

    event.changes.keys.forEach(
        (change, blockId) => {

            // -----------------------------
            // NEW BLOCK
            // -----------------------------

            if (change.action === "add") {

                const yBlock =
                    blocks.get(blockId);

                if (!yBlock) {
                    return;
                }

                const newBlock = {
                    _id: blockId,

                    type:
                        yBlock.get("type")
                        || "paragraph",

                    content:
                        yBlock.get("content")
                            ?.toString()
                        || "",

                    level:
                        yBlock.get("level")
                        || 0,

                    language:
                        yBlock.get("language")
                        || null,

                    children: []
                };

                console.log(
                    "NEW REMOTE BLOCK:",
                    newBlock
                );

                setDocument(
                    (previousDocument) => {

                        // Prevent duplicates
                        const alreadyExists =
                            previousDocument.blocks.some(
                                (block) =>
                                    block._id === blockId
                            );

                        if (alreadyExists) {
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

            // -----------------------------
            // DELETED BLOCK
            // -----------------------------

            if (change.action === "delete") {

                console.log(
                    "REMOTE BLOCK DELETED:",
                    blockId
                );

                setDocument(
                    (previousDocument) => ({

                        ...previousDocument,

                        blocks:
                            previousDocument.blocks.filter(
                                (block) =>
                                    block._id !== blockId
                            )

                    })
                );
            }

        }
    );
};

blocks.observe(
    handleBlocksChange
);

           if (blocks.size === 0) {

    data.document.blocks.forEach((block) => {

        const yBlock = new Y.Map();

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
            block.language || null
        );

        const yText = new Y.Text();

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

    });

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

                console.log("FINISHED LOADING");

                setLoading(false);
            }
        };

        // THIS WAS MISSING
        loadDocument();
return () => {

    console.log("CLEANING UP YJS CONNECTION");

    blocks.unobserve(handleBlocksChange);

    if (yjsRef.current) {

        yjsRef.current.destroy();

        yjsRef.current = null;
    }

};

    }, []);
    const handleBlockFocus = (blockId) => {

    setActiveUsers((previous) => ({
        ...previous,
        [blockId]: currentUser
    }));

};

const handleBlockBlur = (blockId) => {

    setActiveUsers((previous) => {

        const updated = {
            ...previous
        };

        delete updated[blockId];

        return updated;

    });

};
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

        // Create block in MongoDB
        const data = await createBlock(
            blockData
        );

        const newBlock = data.block;

        // -----------------------------------------
        // Add block to React state
        // -----------------------------------------

        setDocument((previousDocument) => ({
            ...previousDocument,

            blocks: [
                ...previousDocument.blocks,
                newBlock
            ]
        }));

        // -----------------------------------------
        // Add block to Yjs
        // -----------------------------------------

        const yjsConnection =
            yjsRef.current;

        if (yjsConnection) {

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

            yjsConnection.blocks.set(
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
            "Failed to create block:",
            error
        );

    }
};

    const handleBlockChange = (blockId, content) => {

        setDocument((previousDocument) => {

            const updatedBlocks = previousDocument.blocks.map(
                (block) => {

                    if (block._id === blockId) {

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
                blocks: updatedBlocks
            };
        });

        if (saveTimers.current[blockId]) {

            clearTimeout(
                saveTimers.current[blockId]
            );

        }

        saveTimers.current[blockId] = setTimeout(
            async () => {

                try {

                    await updateBlock(
                        blockId,
                        content
                    );

                    console.log(
                        "Block saved:",
                        blockId
                    );

                } catch (error) {

                    console.error(
                        "Failed to save block:",
                        error
                    );

                }

            },
            500
        );
    };

    if (loading) {

        return <h2>Loading document...</h2>;

    }

    if (!document) {

        return <h2>Document not found</h2>;

    }

    return (
        <div>

            <h1>{document.title}</h1>
            <div
    style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px"
    }}
>
    <button
        onClick={() =>
            handleAddBlock("paragraph")
        }
    >
        + Paragraph
    </button>

    <button
        onClick={() =>
            handleAddBlock("heading")
        }
    >
        + Heading
    </button>

    <button
        onClick={() =>
            handleAddBlock("code")
        }
    >
        + Code
    </button>

    <button
        onClick={() =>
            handleAddBlock("bullet")
        }
    >
        + Bullet
    </button>
</div>

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
                Editing as: <strong>{currentUser}</strong>
            </div>
            <div
    style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "20px",
        flexWrap: "wrap"
    }}
>
    <strong>Online:</strong>

    {onlineUsers.map((user, index) => (

        <span
            key={index}
            style={{
                padding: "5px 10px",
                borderRadius: "20px",
                background: "#1f7a4d",
                color: "white"
            }}
        >
            🟢 {user.name}
        </span>

    ))}
</div>

            {document.blocks.map((block) => {

                const yBlock = yjsRef.current?.blocks.get(block._id);

                return (
                    <EditableBlock
                        key={block._id}
                        block={block}
                        yBlock={yBlock}
                        onChange={handleBlockChange}
                    />
                );

            })}

        </div>
    );
}

export default Editor;