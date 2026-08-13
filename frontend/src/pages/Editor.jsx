import {
    getDocument,
    updateBlock
} from "../services/documentService"; import EditableBlock from "../components/EditableBlock";
import { useEffect, useRef, useState } from "react";
import { createYjsConnection } from "../services/yjsService";
const DOCUMENT_ID = "6a7c775e1e1354cef663ebc5";

function Editor() {

    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const saveTimers = useRef({});
    const yjsRef = useRef(null);

    useEffect(() => {

        const loadDocument = async () => {

            try {
                const data = await getDocument(DOCUMENT_ID);

                setDocument(data.document);
                const connection = createYjsConnection(DOCUMENT_ID);

yjsRef.current = connection;

const { blocks } = connection;

data.document.blocks.forEach((block) => {

    if (!blocks.has(block._id)) {

        blocks.set(
            block._id,
            {
                type: block.type,
                content: block.content,
                level: block.level || 0,
                language: block.language || null
            }
        );

    }

});
console.log("Yjs blocks:", blocks.toJSON());

            } catch (error) {
                console.error("Failed to load document:", error);

            } finally {
                setLoading(false);
            }
        };

        return () => {

            if (yjsRef.current) {

                yjsRef.current.provider.destroy();
                yjsRef.current.ydoc.destroy();

            }

        };

    }, []);

    const handleBlockChange = (blockId, content) => {

        // Update UI immediately
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

        // Cancel previous timer for this block
        if (saveTimers.current[blockId]) {
            clearTimeout(saveTimers.current[blockId]);
        }

        // Wait 500ms before saving
        saveTimers.current[blockId] = setTimeout(async () => {

            try {

                await updateBlock(blockId, content);

                console.log("Block saved:", blockId);

            } catch (error) {

                console.error("Failed to save block:", error);

            }

        }, 500);
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

            {document.blocks.map((block) => (

                <EditableBlock
                    key={block._id}
                    block={block}
                    onChange={handleBlockChange}
                />

            ))}

        </div>
    );
}

export default Editor;