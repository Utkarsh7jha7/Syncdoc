import { useEffect, useState } from "react";

function EditableBlock({
    block,
    yBlock,
    onChange
}) {

    const yText = yBlock?.get("content");

    const [content, setContent] = useState(
        yText
            ? yText.toString()
            : block.content || ""
    );

    // =========================================
    // LISTEN FOR YJS CHANGES
    // =========================================

    useEffect(() => {

        if (!yText) {
            console.log(
                "NO Y.TEXT FOR BLOCK:",
                block._id
            );

            return;
        }

        console.log(
            "Y.TEXT OBSERVER ATTACHED:",
            block._id
        );

        const handleYjsChange = () => {

            const newContent =
                yText.toString();

            console.log(
                "EDITABLE BLOCK RECEIVED YJS CHANGE:",
                newContent
            );

            setContent(newContent);

        };

        yText.observe(handleYjsChange);

        return () => {

            console.log(
                "Y.TEXT OBSERVER REMOVED:",
                block._id
            );

            yText.unobserve(
                handleYjsChange
            );

        };

    }, [yText, block._id]);

    // =========================================
    // USER TYPES
    // =========================================

    const handleChange = (event) => {

        const newContent =
            event.target.value;

        // Update React immediately
        setContent(newContent);

        if (yText) {

            const oldContent =
                yText.toString();

            // ---------------------------------
            // Find changed section
            // ---------------------------------

            let start = 0;

            while (
                start < oldContent.length &&
                start < newContent.length &&
                oldContent[start] ===
                    newContent[start]
            ) {

                start++;

            }

            // ---------------------------------
            // Find unchanged ending
            // ---------------------------------

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

            console.log(
                "LOCAL EDIT:",
                {
                    oldContent,
                    newContent,
                    start,
                    deleteLength,
                    insertedText
                }
            );

            // ---------------------------------
            // Update Y.Text
            // ---------------------------------

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

        // -------------------------------------
        // Save local change to MongoDB
        // -------------------------------------

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