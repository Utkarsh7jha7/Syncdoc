import { useEffect, useState } from "react";

function EditableBlock({
    block,
    yBlock,
    onChange,
    onFocus,
    onBlur,
    onDelete,
    editingUsers = []
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

        const handleYjsChange = (event) => {

            /*
             * Ignore the change caused by our own
             * local typing because React has already
             * updated the textarea.
             */

            if (event.transaction.local) {
                return;
            }

            const newContent =
                yText.toString();

            console.log(
                "REMOTE CHANGE:",
                block._id,
                newContent
            );

            setContent(newContent);

            /*
             * Update Mongo/React state with the
             * merged Yjs result.
             */
            onChange(
                block._id,
                newContent,
                true
            );

        };


        yText.observe(
            handleYjsChange
        );


        return () => {

            yText.unobserve(
                handleYjsChange
            );

        };

    }, [yText, block._id]);


    // =========================================
    // HANDLE USER TYPING
    // =========================================

    const handleChange = (event) => {

        const newContent =
            event.target.value;


        /*
         * Update UI immediately.
         */
        setContent(
            newContent
        );


        if (!yText) {

            onChange(
                block._id,
                newContent
            );

            return;

        }


        const oldContent =
            yText.toString();


        // =====================================
        // FIND COMMON PREFIX
        // =====================================

        let start = 0;


        while (
            start < oldContent.length &&
            start < newContent.length &&
            oldContent[start] ===
                newContent[start]
        ) {

            start++;

        }


        // =====================================
        // FIND COMMON SUFFIX
        // =====================================

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
            "LOCAL YJS EDIT:",
            {
                blockId: block._id,
                oldContent,
                newContent,
                start,
                deleteLength,
                insertedText
            }
        );


        // =====================================
        // APPLY CRDT UPDATE
        // =====================================

        yText.doc.transact(
            () => {

                if (
                    deleteLength > 0
                ) {

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

            }
        );


        // =====================================
        // SAVE TO MONGODB
        // =====================================

        onChange(
            block._id,
            newContent
        );

    };


    // =========================================
    // EDITING USER INDICATOR
    // =========================================

    const editingIndicator =
        editingUsers.length > 0
            ? (
                <div
                    style={{
                        marginBottom: "6px",
                        padding: "5px 10px",
                        color: "#22c55e",
                        fontSize: "13px",
                        fontWeight: "bold",
                        background: "#111827",
                        borderRadius: "6px",
                        width: "fit-content"
                    }}
                >

                    ✏️{" "}

                    {editingUsers
                        .map(
                            (user) =>
                                user.name
                        )
                        .join(", ")}

                    {" "}

                    {editingUsers.length === 1
                        ? "is editing this block"
                        : "are editing this block"}

                </div>
            )
            : null;


    // =========================================
    // COMMON TEXTAREA PROPERTIES
    // =========================================

    const commonProps = {

        value: content,

        onChange:
            handleChange,

        onFocus: () => {

            onFocus(
                block._id
            );

        },

        onBlur: () => {

            onBlur(
                block._id
            );

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
    // DELETE BUTTON
    // =========================================

    const deleteButton = (

        <button
            onClick={() =>
                onDelete(
                    block._id
                )
            }

            style={{
                marginBottom: "5px",
                padding: "5px 10px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
            }}
        >
            Delete
        </button>

    );


    // =========================================
    // HEADING
    // =========================================

    if (
        block.type === "heading"
    ) {

        return (

            <div
                style={{
                    marginBottom: "15px"
                }}
            >

                {editingIndicator}

                {deleteButton}

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

                        fontWeight:
                            "bold",

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
    // CODE BLOCK
    // =========================================

    if (
        block.type === "code"
    ) {

        return (

            <div
                style={{
                    marginBottom: "15px"
                }}
            >

                {editingIndicator}

                {deleteButton}

                <textarea
                    {...commonProps}

                    rows={6}

                    spellCheck={false}

                    style={{
                        ...commonProps.style,

                        background:
                            "#111827",

                        color:
                            "#e5e7eb",

                        fontFamily:
                            "monospace",

                        fontSize:
                            "14px",

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

    if (
        block.type === "bullet"
    ) {

        return (

            <div
                style={{
                    marginBottom: "10px"
                }}
            >

                {editingIndicator}

                {deleteButton}

                <div
                    style={{
                        display: "flex",
                        alignItems:
                            "flex-start"
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

            </div>

        );

    }


    // =========================================
    // PARAGRAPH
    // =========================================

    return (

        <div
            style={{
                marginBottom: "15px"
            }}
        >

            {editingIndicator}

            {deleteButton}

            <textarea
                {...commonProps}

                rows={3}

                style={{
                    ...commonProps.style,

                    background:
                        "#151C2C",

                    border:
                        "1px solid #374151",

                    fontSize:
                        "16px"
                }}
            />

        </div>

    );

}


export default EditableBlock;

