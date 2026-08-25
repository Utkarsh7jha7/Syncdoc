import {
    useEffect,
    useState
} from "react";


function EditableBlock({
    block,
    yBlock,
    onChange,
    onFocus,
    onBlur,
    onDelete,
    editingUsers = []
}) {

    // =========================================
    // YJS TEXT
    // =========================================

    const yText =
        yBlock?.get("content");


    // =========================================
    // LOCAL CONTENT STATE
    // =========================================

    const [
        content,
        setContent
    ] = useState(
        yText
            ? yText.toString()
            : block.content || ""
    );


    // =========================================
    // UPDATE LOCAL STATE WHEN BLOCK CHANGES
    // =========================================

    useEffect(() => {

        const currentText =
            yText
                ? yText.toString()
                : block.content || "";


        setContent(
            currentText
        );

    }, [
        block._id,
        yText
    ]);


    // =========================================
    // LISTEN FOR REMOTE / UNDO / REDO CHANGES
    // =========================================

    useEffect(() => {

        if (!yText) {
            return;
        }


        const handleYjsChange = () => {

            const newContent =
                yText.toString();


            setContent(
                newContent
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

    }, [
        yText
    ]);


    // =========================================
    // HANDLE TEXT CHANGE
    // =========================================

    const handleChange = (
        event
    ) => {

        const newContent =
            event.target.value;


        // =====================================
        // UPDATE YJS
        // =====================================

        if (yText) {

            const oldContent =
                yText.toString();


            // ---------------------------------
            // FIND COMMON PREFIX
            // ---------------------------------

            let start = 0;


            while (
                start <
                    oldContent.length &&
                start <
                    newContent.length &&
                oldContent[start] ===
                    newContent[start]
            ) {

                start++;

            }


            // ---------------------------------
            // FIND COMMON SUFFIX
            // ---------------------------------

            let oldEnd =
                oldContent.length;


            let newEnd =
                newContent.length;


            while (
                oldEnd > start &&
                newEnd > start &&
                oldContent[
                    oldEnd - 1
                ] ===
                    newContent[
                        newEnd - 1
                    ]
            ) {

                oldEnd--;

                newEnd--;

            }


            // ---------------------------------
            // CALCULATE CHANGE
            // ---------------------------------

            const deleteLength =
                oldEnd - start;


            const insertedText =
                newContent.slice(
                    start,
                    newEnd
                );


            // =================================
            // LOCAL TRANSACTION
            // =================================
            //
            // IMPORTANT:
            // "local" is the origin tracked
            // by our UndoManager.
            // =================================

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

                },
                "local"
            );

        }


        // =====================================
        // UPDATE REACT STATE
        // =====================================

        setContent(
            newContent
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
                        marginBottom:
                            "6px",

                        padding:
                            "6px 10px",

                        color:
                            "#22c55e",

                        fontSize:
                            "13px",

                        fontWeight:
                            "bold",

                        background:
                            "#111827",

                        borderRadius:
                            "6px",

                        width:
                            "fit-content"
                    }}
                >

                    🟢{" "}

                    {editingUsers
                        .map(
                            (user) =>
                                typeof user ===
                                "string"
                                    ? user
                                    : user.name
                        )
                        .join(", ")}

                    {" "}

                    {editingUsers.length ===
                    1
                        ? "is editing this block"
                        : "are editing this block"}

                </div>

            )
            : null;


    // =========================================
    // COMMON TEXTAREA PROPERTIES
    // =========================================

    const commonProps = {

        value:
            content,

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

            width:
                "100%",

            padding:
                "10px",

            color:
                "white",

            borderRadius:
                "8px",

            resize:
                "vertical",

            outline:
                "none"

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
                marginBottom:
                    "5px",

                padding:
                    "5px 10px",

                background:
                    "#dc2626",

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

            Delete

        </button>

    );


    // =========================================
    // HEADING
    // =========================================

    if (
        block.type ===
        "heading"
    ) {

        return (

            <div
                style={{
                    marginBottom:
                        "15px"
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
    // CODE
    // =========================================

    if (
        block.type ===
        "code"
    ) {

        return (

            <div
                style={{
                    marginBottom:
                        "15px"
                }}
            >

                {editingIndicator}

                {deleteButton}


                <textarea
                    {...commonProps}

                    rows={6}

                    spellCheck={
                        false
                    }

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
        block.type ===
        "bullet"
    ) {

        return (

            <div
                style={{
                    marginBottom:
                        "10px"
                }}
            >

                {editingIndicator}

                {deleteButton}


                <div
                    style={{
                        display:
                            "flex",

                        alignItems:
                            "flex-start"
                    }}
                >

                    <span
                        style={{
                            color:
                                "white",

                            fontSize:
                                "20px",

                            marginRight:
                                "10px"
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
                marginBottom:
                    "15px"
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