import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDocuments } from "../services/documentService";
import "../styles/sidebar.css";

function Sidebar() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await getDocuments();
        // Assuming API returns array of documents
        setDocuments(data.documents || data);
      } catch (err) {
        console.error("Failed to fetch documents", err);
      }
    };
    fetchDocs();
  }, []);

  return (
    <div className="sidebar glass">
      <h2 className="sidebar-title">My Documents</h2>
      {documents.length === 0 ? (
        <p>No documents yet.</p>
      ) : (
        <ul className="doc-list">
          {documents.map((doc) => (
            <li key={doc._id} className="doc-item">
              <Link to={`/doc/${doc._id}`}>{doc.title || "Untitled"}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Sidebar;
