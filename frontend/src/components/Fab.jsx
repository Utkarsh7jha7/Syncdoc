import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/feature.css";

function Fab() {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/new-doc");
  };
  return (
    <button className="fab" onClick={handleClick} aria-label="Create new document">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

export default Fab;
