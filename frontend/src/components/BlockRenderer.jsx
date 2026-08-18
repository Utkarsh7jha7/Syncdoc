function BlockRenderer({ block }) {

    if (block.type === "heading") {

        if (block.level === 1) {
            return <h1>{block.content}</h1>;
        }

        if (block.level === 3) {
            return <h3>{block.content}</h3>;
        }

        return <h2>{block.content}</h2>;
    }

    if (block.type === "code") {

        return (
            <pre
                style={{
                    background: "#111827",
                    color: "#e5e7eb",
                    padding: "15px",
                    borderRadius: "8px",
                    overflowX: "auto"
                }}
            >
                <code>{block.content}</code>
            </pre>
        );
    }

    if (block.type === "bullet") {

        return (
            <li
                style={{
                    marginBottom: "8px"
                }}
            >
                {block.content}
            </li>
        );
    }

    // Default = paragraph

    return (
        <p
            style={{
                fontSize: "16px",
                lineHeight: "1.6",
                marginBottom: "15px"
            }}
        >
            {block.content}
        </p>
    );
}

export default BlockRenderer;