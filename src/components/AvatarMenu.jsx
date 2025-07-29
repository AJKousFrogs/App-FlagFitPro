import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AvatarMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userSettings, setUserSettings] = useState({});
  const { user, logout } = useAuth();

  // Backend Integration - Fetch user profile and settings
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserSettings();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  // Backend Integration - Update user settings
  const updateSetting = async (settingKey, value) => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [settingKey]: value })
      });
      
      if (response.ok) {
        setUserSettings(prev => ({ ...prev, [settingKey]: value }));
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  // Backend Integration - Export user data
  const exportUserData = async () => {
    try {
      const response = await fetch('/api/user/export', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flagfit-pro-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting user data:', error);
    }
  };

  // Backend Integration - Backup user data
  const backupUserData = async () => {
    try {
      const response = await fetch('/api/user/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Backup created successfully: ${data.backupId}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  // Backend Integration - Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      logout();
    }
  };

  // Minimal UI - Avatar dropdown menu
  return (
    <div className="avatar-menu">
      <button 
        className="avatar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        👤 {userProfile?.name || user?.email}
      </button>
      
      {isOpen && (
        <div className="avatar-dropdown">
          <div className="user-info">
            <h3>👤 {userProfile?.name || user?.email}</h3>
            <p>Position: {userProfile?.position || 'QB/WR'}</p>
            <p>Team: {userProfile?.team || 'Hawks'}</p>
          </div>
          
          <div className="menu-section">
            <h4>📊 Profile & Settings</h4>
            <button onClick={() => window.location.href = '/profile'}>
              Personal Information
            </button>
            <button onClick={() => window.location.href = '/settings'}>
              Olympic Performance Settings
            </button>
            <button onClick={() => window.location.href = '/notifications'}>
              Notification Preferences
            </button>
            <button onClick={() => window.location.href = '/privacy'}>
              Privacy & Security
            </button>
          </div>
          
          <div className="menu-section">
            <h4>🏆 Olympic Training</h4>
            <button onClick={() => window.location.href = '/training/history'}>
              Training History
            </button>
            <button onClick={() => window.location.href = '/analytics'}>
              Performance Analytics
            </button>
            <button onClick={() => window.location.href = '/injury-prevention'}>
              Injury Prevention Log
            </button>
            <button onClick={() => window.location.href = '/olympic-progress'}>
              Olympic Qualification Progress
            </button>
          </div>
          
          <div className="menu-section">
            <h4>👥 Team Management</h4>
            <button onClick={() => window.location.href = '/team/chemistry'}>
              Team Chemistry Overview
            </button>
            <button onClick={() => window.location.href = '/team/connections'}>
              Teammate Connections
            </button>
            <button onClick={() => window.location.href = '/team/communication'}>
              Communication Hub
            </button>
            <button onClick={() => window.location.href = '/team/analytics'}>
              Team Performance Analytics
            </button>
          </div>
          
          <div className="menu-section">
            <h4>📁 Data Management</h4>
            <button onClick={exportUserData}>
              Export Performance Data
            </button>
            <button onClick={backupUserData}>
              Create Backup
            </button>
            <button onClick={() => window.location.href = '/sync-status'}>
              Sync Status
            </button>
          </div>
          
          <div className="menu-section">
            <h4>❓ Help & Support</h4>
            <button onClick={() => window.location.href = '/help/olympic-guide'}>
              Olympic Training Guide
            </button>
            <button onClick={() => window.location.href = '/help/injury-prevention'}>
              Injury Prevention Resources
            </button>
            <button onClick={() => window.location.href = '/help/performance-tips'}>
              Performance Optimization Tips
            </button>
            <button onClick={() => window.location.href = '/support'}>
              Contact Olympic Support Team
            </button>
          </div>
          
          <div className="menu-section">
            <h4>⚙️ Accessibility</h4>
            <label>
              <input
                type="checkbox"
                checked={userSettings.highContrast || false}
                onChange={(e) => updateSetting('highContrast', e.target.checked)}
              />
              High Contrast Mode
            </label>
            <label>
              <input
                type="checkbox"
                checked={userSettings.voiceCommands || false}
                onChange={(e) => updateSetting('voiceCommands', e.target.checked)}
              />
              Voice Commands
            </label>
            <label>
              <input
                type="checkbox"
                checked={userSettings.screenReader || false}
                onChange={(e) => updateSetting('screenReader', e.target.checked)}
              />
              Screen Reader Support
            </label>
          </div>
          
          <div className="menu-section">
            <button onClick={handleLogout} className="logout-button">
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarMenu; 