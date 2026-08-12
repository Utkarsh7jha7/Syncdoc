import axios from "axios";

const API_URL = "http://localhost:5000/api/documents";

export const getDocument = async (documentId) => {
    const response = await axios.get(`${API_URL}/${documentId}`);

    return response.data;
};