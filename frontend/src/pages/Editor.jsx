import {
    getDocument,
    updateBlock
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

    if (yjsRef.current) {

        yjsRef.current.awareness.destroy();

        yjsRef.current.socket.close();

        yjsRef.current.ydoc.destroy();

        yjsRef.current = null;
    }

};

    }, []);

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