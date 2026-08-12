function BlockRenderer({ block }) {

    switch (block.type) {

        case "heading":
            return (
                <h2>
                    {block.content}
                </h2>
            );

        case "paragraph":
            return (
                <p>
                    {block.content}
                </p>
            );

        case "code":
            return (
                <pre>
                    <code>
                        {block.content}
                    </code>
                </pre>
            );

        case "quote":
            return (
                <blockquote>
                    {block.content}
                </blockquote>
            );

        case "bullet-list":
            return (
                <ul>
                    {block.children?.map((child) => (
                        <BlockRenderer
                            key={child._id}
                            block={child}
                        />
                    ))}
                </ul>
            );

        case "numbered-list":
            return (
                <ol>
                    {block.children?.map((child) => (
                        <BlockRenderer
                            key={child._id}
                            block={child}
                        />
                    ))}
                </ol>
            );

        case "list-item":
            return (
                <li>
                    {block.content}

                    {block.children?.map((child) => (
                        <BlockRenderer
                            key={child._id}
                            block={child}
                        />
                    ))}
                </li>
            );

        default:
            return null;
    }
}

export default BlockRenderer;