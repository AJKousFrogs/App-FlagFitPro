import React, { useState } from 'react';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notification-center">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: '1px solid #333',
          background: 'white',
          padding: '4px',
          cursor: 'pointer'
        }}
      >
        🔔
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          background: 'white',
          border: '1px solid #333',
          padding: '10px',
          minWidth: '300px',
          zIndex: 1000
        }}>
          <h3>Notifications</h3>
          <p>No new notifications</p>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;