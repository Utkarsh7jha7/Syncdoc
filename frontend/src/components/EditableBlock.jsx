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

    editingUsers = [],

    draggable = false,

    onDragStart,

    onDragOver,

    onDrop

}) {

    // =========================================
    // YJS TEXT
    // =========================================

    const yText =
        yBlock?.get(
            "content"
        );


    // =========================================
    // CONTENT
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
    // SYNC BLOCK CONTENT
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
    // REMOTE YJS CHANGES
    // =========================================

    useEffect(() => {

        if (!yText) {
            return;
        }


        const handleYjsChange =
            () => {

                setContent(
                    yText.toString()
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
    // TEXT CHANGE
    // =========================================

    const handleChange =
        (event) => {

            const newContent =
                event.target.value;


            if (yText) {

                const oldContent =
                    yText.toString();


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


                const deleteLength =
                    oldEnd - start;


                const insertedText =
                    newContent.slice(
                        start,
                        newEnd
                    );


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


            setContent(
                newContent
            );


            onChange(
                block._id,
                newContent
            );

        };


    // =========================================
    // EDITING USERS
    // =========================================

    const editingIndicator =
        editingUsers.length > 0
            ? (

                <div
                    className="syncdoc-editing-indicator"
                >

                    ✎{" "}

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
                        ? "is editing"
                        : "are editing"}

                </div>

            )
            : null;


    // =========================================
    // COMMON TEXTAREA
    // =========================================

    const commonProps = {

        value:
            content,

        onChange:
            handleChange,

        onFocus:
            () =>
                onFocus(
                    block._id
                ),

        onBlur:
            () =>
                onBlur(
                    block._id
                ),

        draggable:
            false

    };


    // =========================================
    // SHARED BLOCK HEADER
    // =========================================

    const blockHeader = (

        <div
            className="syncdoc-block-top"
        >

            <div
                className="syncdoc-drag-handle"
                title="Drag block"
            >
                ⋮⋮
            </div>


            <div
                className="syncdoc-block-type"
            >

                {block.type ===
                    "heading" &&
                    "heading"}

                {block.type ===
                    "paragraph" &&
                    "paragraph"}

                {block.type ===
                    "code" &&
                    (
                        block.language ||
                        "code"
                    )}

                {block.type ===
                    "bullet" &&
                    "bullet"}

                {![
                    "heading",
                    "paragraph",
                    "code",
                    "bullet"
                ].includes(
                    block.type
                ) &&
                    block.type}

            </div>


            <button
                className="syncdoc-delete"
                onClick={() =>
                    onDelete(
                        block._id
                    )
                }
                type="button"
            >

                ×

            </button>

        </div>

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
                className="syncdoc-block"
                draggable={
                    draggable
                }
                onDragStart={
                    onDragStart
                }
                onDragOver={
                    onDragOver
                }
                onDrop={
                    onDrop
                }
            >

                {blockHeader}

                {editingIndicator}


                <textarea

                    {...commonProps}

                    className="syncdoc-textarea syncdoc-heading"

                    rows={1}

                    style={{
                        fontSize:
                            block.level === 1
                                ? "28px"
                                : block.level === 3
                                    ? "20px"
                                    : "24px"
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
                className="syncdoc-block"
                draggable={
                    draggable
                }
                onDragStart={
                    onDragStart
                }
                onDragOver={
                    onDragOver
                }
                onDrop={
                    onDrop
                }
            >

                <div
                    className="syncdoc-block-top"
                >

                    <div
                        className="syncdoc-drag-handle"
                    >
                        ⋮⋮
                    </div>


                    <div
                        className="syncdoc-block-type"
                    >
                        <span>
                            ◇
                        </span>

                        {block.language ||
                            "javascript"}

                    </div>


                    <button
                        className="syncdoc-delete"
                        onClick={() =>
                            onDelete(
                                block._id
                            )
                        }
                        type="button"
                    >
                        ×
                    </button>

                </div>


                {editingIndicator}


                <div
                    className="syncdoc-code-wrapper"
                >

                    <div
                        className="syncdoc-code-line-numbers"
                    >
                        1
                    </div>


                    <textarea
                        {...commonProps}
                        className="syncdoc-textarea syncdoc-code"
                        rows={7}
                        spellCheck={
                            false
                        }
                    />

                </div>

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
                className="syncdoc-block syncdoc-bullet-block"
                draggable={
                    draggable
                }
                onDragStart={
                    onDragStart
                }
                onDragOver={
                    onDragOver
                }
                onDrop={
                    onDrop
                }
            >

                {blockHeader}

                {editingIndicator}


                <div
                    className="syncdoc-bullet-row"
                >

                    <span
                        className="syncdoc-bullet"
                    >
                        •
                    </span>


                    <textarea
                        {...commonProps}
                        className="syncdoc-textarea"
                        rows={1}
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
            className="syncdoc-block"
            draggable={
                draggable
            }
            onDragStart={
                onDragStart
            }
            onDragOver={
                onDragOver
            }
            onDrop={
                onDrop
            }
        >

            {blockHeader}

            {editingIndicator}


            <textarea
                {...commonProps}
                className="syncdoc-textarea"
                rows={3}
            />

        </div>

    );

}


export default EditableBlock;