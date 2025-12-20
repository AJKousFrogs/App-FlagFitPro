import React, { useState } from 'react';

const BackupManager = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="backup-manager">
      <button 
        onClick={() => setIsVisible(!isVisible)}
        style={{
          border: '1px solid #333',
          background: 'white',
          padding: '4px',
          cursor: 'pointer'
        }}
      >
        💾
      </button>
      {isVisible && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          background: 'white',
          border: '1px solid #333',
          padding: '10px',
          minWidth: '200px',
          zIndex: 1000
        }}>
          <h3>Backup Manager</h3>
          <button>Create Backup</button>
          <button>View Backups</button>
        </div>
      )}
    </div>
  );
};

export default BackupManager;