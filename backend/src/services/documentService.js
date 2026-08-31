import axios from "axios";

const API_URL = "http://localhost:5000/api/documents";

export const getDocument = async (documentId) => {
    const response = await axios.get(`${API_URL}/${documentId}`);

    return response.data;
};

export const updateBlock = async (blockId, content) => {
    const response = await axios.put(
        `http://localhost:5000/api/blocks/${blockId}`,
        {
            content
        }
    );

    return response.data;
    
};
// =========================================
// CREATE VERSION
// =========================================

export const createVersion = async (
    documentId
) => {

    const response =
        await fetch(
            `http://localhost:5000/api/documents/${documentId}/versions`,
            {
                method:
                    "POST"
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Failed to create version"
        );

    }


    return data;

};


// =========================================
// GET VERSION HISTORY
// =========================================

export const getVersions = async (
    documentId
) => {

    const response =
        await fetch(
            `http://localhost:5000/api/documents/${documentId}/versions`
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Failed to fetch versions"
        );

    }


    return data;

};


// =========================================
// RESTORE VERSION
// =========================================

export const restoreVersion = async (
    documentId,
    versionId
) => {

    const response =
        await fetch(
            `http://localhost:5000/api/documents/${documentId}/versions/${versionId}/restore`,
            {
                method:
                    "POST"
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Failed to restore version"
        );

    }


    return data;

};