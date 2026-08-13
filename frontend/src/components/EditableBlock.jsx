import { useEffect, useState } from "react";

function EditableBlock({ block, onChange }) {

    const [content, setContent] = useState(block.content);

    useEffect(() => {

        setContent(block.content);

    }, [block.content]);

    const handleChange = (event) => {

        const newContent = event.target.value;

        setContent(newContent);

        onChange(block._id, newContent);
    };

    if (block.type === "heading") {

        return (
            <input
                value={content}
                onChange={handleChange}
                className="heading-input"
            />
        );
    }

    if (block.type === "code") {

        return (
            <textarea
                value={content}
                onChange={handleChange}
                className="code-input"
            />
        );
    }

    return (
        <textarea
            value={content}
            onChange={handleChange}
            className="paragraph-input"
        />
    );
}

export default EditableBlock;