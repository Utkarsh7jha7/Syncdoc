import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getDocuments,
    createDocument
} from "../services/documentService";
import {
    getCurrentUser,
    logoutUser
} from "../services/userService";
import "../styles/documents.css";

function Documents() {
    const navigate = useNavigate();

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCreate, setShowCreate] =
        useState(false);

    const [title, setTitle] =
        useState("");

    const [creating, setCreating] =
        useState(false);

    const currentUser =
        getCurrentUser();


    // =====================================
    // LOAD DOCUMENTS
    // =====================================

    useEffect(() => {
        const loadDocuments = async () => {
            try {
                const data =
                    await getDocuments();

                setDocuments(
                    data.documents || []
                );
            } catch (error) {
                console.error(
                    "FAILED TO LOAD DOCUMENTS:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        loadDocuments();
    }, []);


    // =====================================
    // CREATE DOCUMENT
    // =====================================

    const handleCreate = async () => {
        if (!title.trim()) {
            return;
        }

        try {
            setCreating(true);

            const data =
                await createDocument({
                    title: title.trim()
                });

            const document =
                data.document;

            if (!document?._id) {
                throw new Error(
                    "Document ID not returned"
                );
            }

            navigate(
                `/doc/${document._id}`
            );

        } catch (error) {
            console.error(
                "FAILED TO CREATE DOCUMENT:",
                error
            );
        } finally {
            setCreating(false);
        }
    };


    // =====================================
    // LOGOUT
    // =====================================

    const handleLogout = () => {
        logoutUser();
        navigate("/login");
    };


    // =====================================
    // OPEN DOCUMENT
    // =====================================

    const openDocument = (documentId) => {
        navigate(
            `/doc/${documentId}`
        );
    };


    return (
        <div className="documents-page">

            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <header className="documents-header">

                <div className="documents-brand">

                    <div className="documents-logo">
                        S
                    </div>

                    <span>
                        SyncDoc
                    </span>

                </div>


                <div className="documents-header-right">

                    <div className="documents-user">

                        <div className="documents-user-avatar">
                            {currentUser
                                ?.charAt(0)
                                ?.toUpperCase()}
                        </div>

                        <span>
                            {currentUser}
                        </span>

                    </div>


                    <button
                        className="documents-logout"
                        onClick={
                            handleLogout
                        }
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* ================================= */}
            {/* MAIN CONTENT */}
            {/* ================================= */}

            <main className="documents-main">

                <div className="documents-title-row">

                    <div>
                        <h1>
                            Your Documents
                        </h1>

                        <p>
                            Create, manage and
                            collaborate on your
                            documents.
                        </p>
                    </div>


                    <button
                        className="new-document-btn"
                        onClick={() =>
                            setShowCreate(
                                true
                            )
                        }
                    >
                        <span>
                            +
                        </span>

                        New Document
                    </button>

                </div>


                {/* ================================= */}
                {/* CREATE DOCUMENT */}
                {/* ================================= */}

                {showCreate && (
                    <div className="create-document-panel">

                        <input
                            type="text"
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                            placeholder="Enter document title"
                            autoFocus
                        />

                        <button
                            className="create-document-confirm"
                            onClick={
                                handleCreate
                            }
                            disabled={creating}
                        >
                            {creating
                                ? "Creating..."
                                : "Create"}
                        </button>

                        <button
                            className="create-document-cancel"
                            onClick={() => {
                                setShowCreate(
                                    false
                                );
                                setTitle("");
                            }}
                        >
                            Cancel
                        </button>

                    </div>
                )}


                {/* ================================= */}
                {/* DOCUMENT LIST */}
                {/* ================================= */}

                {loading ? (
                    <div className="documents-loading">
                        Loading documents...
                    </div>
                ) : documents.length ===
                  0 ? (

                    <div className="documents-empty">

                        <div className="documents-empty-icon">
                            📄
                        </div>

                        <h2>
                            No documents yet
                        </h2>

                        <p>
                            Create your first
                            document to get started.
                        </p>

                    </div>

                ) : (

                    <div className="documents-grid">

                        {documents.map(
                            (doc) => (
                                <div
                                    key={doc._id}
                                    className="document-card"
                                    onClick={() =>
                                        openDocument(
                                            doc._id
                                        )
                                    }
                                >

                                    <div className="document-card-icon">
                                        📄
                                    </div>

                                    <div className="document-card-content">

                                        <h2>
                                            {doc.title}
                                        </h2>

                                        <p>
                                            {doc.updatedAt
                                                ? `Updated ${new Date(
                                                      doc.updatedAt
                                                  ).toLocaleString()}`
                                                : "No recent activity"}
                                        </p>

                                    </div>

                                    <div className="document-card-arrow">
                                        →
                                    </div>

                                </div>
                            )
                        )}

                    </div>

                )}

            </main>

        </div>
    );
}

export default Documents;