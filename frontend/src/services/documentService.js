const API_URL = "http://localhost:5000/api/documents";

// =========================================
// GET SINGLE DOCUMENT
// =========================================

export const getDocument = async (documentId) => {

    const response = await fetch(
        `${API_URL}/${documentId}`
    );

    if (!response.ok) {

        throw new Error(
            "Failed to fetch document"
        );

    }

    return response.json();
};


// =========================================
// GET ALL DOCUMENTS
// =========================================

export const getDocuments = async () => {

    const response = await fetch(
        API_URL
    );

    if (!response.ok) {

        throw new Error(
            "Failed to fetch documents"
        );

    }

    return response.json();
};


// =========================================
// CREATE DOCUMENT
// =========================================

export const createDocument = async (
    documentData
) => {

    const response = await fetch(
        API_URL,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(
                documentData
            )
        }
    );

    if (!response.ok) {

        throw new Error(
            "Failed to create document"
        );

    }

    return response.json();
};


// =========================================
// CREATE BLOCK
// =========================================

export const createBlock = async (
    blockData
) => {

    const response = await fetch(
        "http://localhost:5000/api/blocks",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(
                blockData
            )
        }
    );

    if (!response.ok) {

        throw new Error(
            "Failed to create block"
        );

    }

    return response.json();
};


// =========================================
// UPDATE BLOCK
// =========================================

export const updateBlock = async (
    blockId,
    content
) => {

    const response = await fetch(
        `http://localhost:5000/api/blocks/${blockId}`,
        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                content
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            "Failed to update block"
        );

    }

    return response.json();
};


// =========================================
// DELETE DOCUMENT
// =========================================

export const deleteDocument = async (
    documentId
) => {

    const response = await fetch(
        `${API_URL}/${documentId}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {

        throw new Error(
            "Failed to delete document"
        );

    }

    return response.json();
};
// =========================================
// DELETE BLOCK
// =========================================

export const deleteBlock = async (blockId) => {

    const response = await fetch(
        `http://localhost:5000/api/blocks/${blockId}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {

        throw new Error(
            "Failed to delete block"
        );

    }

    return response.json();
};