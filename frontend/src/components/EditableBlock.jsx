import { useEffect, useState } from "react";

function EditableBlock({
    block,
    yBlock,
    onChange,
    onFocus,
    onBlur
}) {

    const yText = yBlock?.get("content");

    const [content, setContent] = useState(
        yText
            ? yText.toString()
            : block.content || ""
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
    // HANDLE TEXT CHANGE
    // =========================================

    const handleChange = (event) => {

        const newContent =
            event.target.value;

        setContent(newContent);

        if (yText) {

            const oldContent =
                yText.toString();

            let start = 0;

            while (
                start < oldContent.length &&
                start < newContent.length &&
                oldContent[start] ===
                    newContent[start]
            ) {
                start++;
            }

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

            yText.doc.transact(() => {

                if (deleteLength > 0) {

                    yText.delete(
                        start,
                        deleteLength
                    );

                }

                if (insertedText.length > 0) {

                    yText.insert(
                        start,
                        insertedText
                    );

                }

            });

        }

        onChange(
            block._id,
            newContent
        );

    };

    // =========================================
    // COMMON TEXTAREA PROPERTIES
    // =========================================

    const commonProps = {
        value: content,

        onChange: handleChange,

        onFocus: () => {
            onFocus(block._id);
        },

        onBlur: () => {
            onBlur(block._id);
        },

        style: {
            width: "100%",
            padding: "10px",
            color: "white",
            borderRadius: "8px",
            resize: "vertical",
            outline: "none"
        }
    };

    // =========================================
    // HEADING
    // =========================================

    if (block.type === "heading") {

        return (
            <div
                style={{
                    marginBottom: "15px"
                }}
            >

                <textarea
                    {...commonProps}
                    rows={1}
                    style={{
                        ...commonProps.style,

                        fontSize:
                            block.level === 1
                                ? "30px"
                                : block.level === 3
                                ? "22px"
                                : "26px",

                        fontWeight: "bold",

                        background: "#151C2C",

                        border:
                            "1px solid #374151"
                    }}
                />

            </div>
        );
    }

    // =========================================
    // CODE BLOCK
    // =========================================

    if (block.type === "code") {

        return (
            <div
                style={{
                    marginBottom: "15px"
                }}
            >

                <textarea
                    {...commonProps}
                    rows={6}
                    spellCheck={false}
                    style={{
                        ...commonProps.style,

                        background: "#111827",

                        color: "#e5e7eb",

                        fontFamily:
                            "monospace",

                        fontSize: "14px",

                        border:
                            "1px solid #374151"
                    }}
                />

            </div>
        );
    }

    // =========================================
    // BULLET
    // =========================================

    if (block.type === "bullet") {

        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "10px"
                }}
            >

                <span
                    style={{
                        color: "white",
                        fontSize: "20px",
                        marginRight: "10px"
                    }}
                >
                    •
                </span>

                <textarea
                    {...commonProps}
                    rows={1}
                    style={{
                        ...commonProps.style,

                        background:
                            "#151C2C",

                        border:
                            "1px solid #374151"
                    }}
                />

            </div>
        );
    }

    // =========================================
    // DEFAULT = PARAGRAPH
    // =========================================

    return (
        <div
            style={{
                marginBottom: "15px"
            }}
        >

            <textarea
                {...commonProps}
                rows={3}
                style={{
                    ...commonProps.style,

                    background: "#151C2C",

                    border:
                        "1px solid #374151",

                    fontSize: "16px"
                }}
            />

        </div>
    );
}

export default EditableBlock;