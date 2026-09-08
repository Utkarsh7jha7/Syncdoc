import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDocument } from "../services/documentService";
import "../styles/feature.css";

function NewDocument() {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const data = await createDocument({ title: title.trim() });
      const docId = (data.document && data.document._id) || data._id;
      navigate(`/doc/${docId}`);
    } catch (err) {
      console.error("Failed to create document", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="new-doc-container">
      <div className="new-doc-card glass">
        <h2 className="title">Create New Document</h2>
        <input
          type="text"
          placeholder="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
        />
        <button
          className="create-btn"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </div>
    </div>
  );
}

export default NewDocument;
