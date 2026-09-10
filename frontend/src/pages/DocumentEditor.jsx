import React from "react";
import { useParams } from "react-router-dom";
import Editor from "./Editor";

function DocumentEditor() {
    const { id } = useParams();

    return (
        <Editor documentId={id} />
    );
}

export default DocumentEditor;