import { useEffect, useState } from "react";
import { getDocument } from "../services/documentService";
import EditableBlock from "../components/EditableBlock";

const DOCUMENT_ID = "6a7c775e1e1354cef663ebc5";

function Editor() {

    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const loadDocument = async () => {

            try {
                const data = await getDocument(DOCUMENT_ID);

                setDocument(data.document);

            } catch (error) {
                console.error("Failed to load document:", error);

            } finally {
                setLoading(false);
            }
        };

        loadDocument();

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