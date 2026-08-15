import { useEffect, useState } from "react";

function EditableBlock({
    block,
    yBlock,
    onChange
}) {

    // Get Y.Text from Y.Map
    const yText = yBlock?.get("content");

    const [content, setContent] = useState(
        yText
            ? yText.toString()
            : block.content
    );

    // =========================================
    // LISTEN FOR REMOTE YJS CHANGES
    // =========================================

    useEffect(() => {

        if (!yText) {
            return;
        }

        const handleYjsChange = () => {

            const newContent =
                yText.toString();

            console.log(
                "EDITABLE BLOCK RECEIVED YJS CHANGE:",
                newContent
            );

            setContent(newContent);

        };

        yText.observe(
            handleYjsChange
        );

        return () => {

            yText.unobserve(
                handleYjsChange
            );

        };

    }, [yText]);

    // =========================================
    // USER TYPES
    // =========================================

    const handleChange = (event) => {

        const newContent =
            event.target.value;

        setContent(newContent);

        if (yText) {

            const oldContent =
                yText.toString();

            // Find first changed character
            let start = 0;

            while (
                start < oldContent.length &&
                start < newContent.length &&
                oldContent[start] ===
                    newContent[start]
            ) {

                start++;

            }

            // Find last unchanged characters
            let oldEnd =
                oldContent.length;

            let newEnd =
                newContent.length;

            while (
                oldEnd > start &&
                newEnd > start &&
                oldContent[oldEnd - 1] ===
                    newContent[newEnd - 1]
            ) {

                oldEnd--;
                newEnd--;

            }

            const deleteLength =
                oldEnd - start;

            const insertedText =
                newContent.slice(
                    start,
                    newEnd
                );

            // Apply change to Y.Text
            yText.doc.transact(() => {

                if (deleteLength > 0) {

                    yText.delete(
                        start,
                        deleteLength
                    );

                }

                if (
                    insertedText.length > 0
                ) {

                    yText.insert(
                        start,
                        insertedText
                    );

                }

            });

        }

        // Save to MongoDB
        onChange(
            block._id,
            newContent
        );

    };

    return (
        <div
            style={{
                marginBottom: "15px"
            }}
        >

            <textarea
                value={content}
                onChange={handleChange}
                rows={3}
                style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "16px",
                    background: "#151C2C",
                    color: "white",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    resize: "vertical"
                }}
            />

        </div>
    );
}

export default EditableBlock;