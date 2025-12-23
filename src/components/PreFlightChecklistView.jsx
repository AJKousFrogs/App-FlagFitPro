import React, { useState } from "react";

const PreFlightChecklistView = ({ onClose }) => {
  const [checklist] = useState([
    { id: 1, item: "System Status Check", completed: true },
    { id: 2, item: "Database Connection", completed: true },
    { id: 3, item: "API Endpoints", completed: true },
    { id: 4, item: "Cache Status", completed: false },
  ]);

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "white",
        border: "2px solid #333",
        padding: "20px",
        minWidth: "300px",
        zIndex: 1000,
      }}
    >
      <h3>Pre-Flight Checklist</h3>
      {checklist.map((item) => (
        <div key={item.id} style={{ marginBottom: "8px" }}>
          <label>
            <input
              type="checkbox"
              checked={item.completed}
              readOnly
              style={{ marginRight: "8px" }}
            />
            {item.item}
          </label>
        </div>
      ))}
      <button onClick={onClose} style={{ marginTop: "10px" }}>
        Close
      </button>
    </div>
  );
};

export default PreFlightChecklistView;
