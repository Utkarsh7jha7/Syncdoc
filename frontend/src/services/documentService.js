const API_URL =
    "http://localhost:5000/api/documents";

const BLOCK_API_URL =
    "http://localhost:5000/api/blocks";


// =========================================
// GET SINGLE DOCUMENT
// =========================================

export const getDocument = async (
    documentId
) => {

    const response = await fetch(
        `${API_URL}/${documentId}`
    );

    const data =
        await response.json().catch(
            () => null
        );

    if (!response.ok) {

        console.error(
            "GET DOCUMENT FAILED:",
            response.status,
            data
        );

        throw new Error(
            data?.message ||
            `Failed to fetch document (${response.status})`
        );

    }

    return data;
};


// =========================================
// GET ALL DOCUMENTS
// =========================================

export const getDocuments = async () => {

    const response = await fetch(
        API_URL
    );

    const data =
        await response.json().catch(
            () => null
        );

    if (!response.ok) {

        console.error(
            "GET DOCUMENTS FAILED:",
            response.status,
            data
        );

        throw new Error(
            data?.message ||
            `Failed to fetch documents (${response.status})`
        );

    }

    return data;
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

    const data =
        await response.json().catch(
            () => null
        );

    if (!response.ok) {

        console.error(
            "CREATE DOCUMENT FAILED:",
            response.status,
            data
        );

        throw new Error(
            data?.message ||
            `Failed to create document (${response.status})`
        );

    }

    return data;
};


// =========================================
// CREATE BLOCK
// =========================================

export const createBlock = async (
    blockData
) => {

    const response = await fetch(
        BLOCK_API_URL,
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

    const data =
        await response.json().catch(
            () => null
        );

    if (!response.ok) {

        console.error(
            "CREATE BLOCK FAILED:",
            response.status,
            data
        );

        throw new Error(
            data?.message ||
            `Failed to create block (${response.status})`
        );

    }

    return data;
};


// =========================================
// UPDATE BLOCK
// =========================================

export const updateBlock = async (
    blockId,
    content
) => {

    const response = await fetch(
        `${BLOCK_API_URL}/${blockId}`,
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

    const data =
        await response.json().catch(
            () => null
        );

    if (!response.ok) {

        console.error(
            "UPDATE BLOCK FAILED:",
            response.status,
            data
        );

        throw new Error(
            data?.message ||
            `Failed to update block (${response.status})`
        );

    }

    return data;
};


// =========================================
// DELETE BLOCK
// =========================================

export const deleteBlock = async (
    blockId
) => {

    console.log(
        "DELETING BLOCK:",
        blockId
    );

    const response = await fetch(
        `${BLOCK_API_URL}/${blockId}`,
        {
            method: "DELETE"
        }
    );

    const data =
        await response.json().catch(
            () => null
        );


    if (!response.ok) {

        console.error(
            "DELETE BLOCK FAILED:",
            {
                status: response.status,
                statusText:
                    response.statusText,
                data
            }
        );

        throw new Error(
            data?.message ||
            `Failed to delete block (${response.status})`
        );

    }


    console.log(
        "BLOCK DELETED SUCCESSFULLY:",
        data
    );


    return data;
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

    const data =
        await response.json().catch(
            () => null
        );

    if (!response.ok) {

        console.error(
            "DELETE DOCUMENT FAILED:",
            response.status,
            data
        );

        throw new Error(
            data?.message ||
            `Failed to delete document (${response.status})`
        );

    }

    return data;
};