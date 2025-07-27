import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import BackupService from '../services/BackupService';
import NotificationService from '../services/NotificationService';

const FloatingActionButton = ({ currentUser, onBackupOpen, onNotificationOpen }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyData, setEmergencyData] = useState({
    location: '',
    description: '',
    severity: 'high'
  });
  const fabRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickBackup = async () => {
    try {
      setIsExpanded(false);
      const result = await BackupService.createBackup({
        type: 'manual',
        description: 'Quick backup from FAB',
        categories: ['safety_data', 'user_profiles', 'team_data']
      });
      
      // Show success notification
      await NotificationService.sendNotification({
        type: 'SYSTEM_UPDATE',
        recipients: [currentUser.id],
        data: {
          message: `Quick backup completed! ID: ${result.backupId}`
        }
      });
    } catch (error) {
      console.error('Quick backup failed:', error);
      alert('Quick backup failed. Please try again.');
    }
  };

  const handleEmergencyAlert = () => {
    setIsExpanded(false);
    setShowEmergencyModal(true);
  };

  const sendEmergencyAlert = async () => {
    if (!emergencyData.location || !emergencyData.description) {
      alert('Please fill in all emergency details');
      return;
    }

    try {
      // Send emergency notification
      await NotificationService.sendEmergencyNotification({
        location: emergencyData.location,
        description: emergencyData.description,
        protocolActivated: true
      });

      // Create emergency backup
      await BackupService.createBackup({
        type: 'manual',
        description: `Emergency backup - ${emergencyData.description}`,
        categories: BackupService.criticalData
      });

      setShowEmergencyModal(false);
      setEmergencyData({ location: '', description: '', severity: 'high' });
      alert('Emergency alert sent and backup created!');
    } catch (error) {
      console.error('Emergency alert failed:', error);
      alert('Failed to send emergency alert. Please contact emergency services directly.');
    }
  };

  const handleNotificationTest = async () => {
    try {
      setIsExpanded(false);
      await NotificationService.sendNotification({
        type: 'TEAM_MESSAGE',
        recipients: [currentUser.id],
        data: {
          senderName: 'System',
          message: 'Test notification from floating action button'
        }
      });
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  const fabActions = [
    {
      icon: '🚨',
      label: 'Emergency Alert',
      action: handleEmergencyAlert,
      className: 'bg-red-500 hover:bg-red-600 text-white'
    },
    {
      icon: '💾',
      label: 'Quick Backup',
      action: handleQuickBackup,
      className: 'bg-blue-500 hover:bg-blue-600 text-white'
    },
    {
      icon: '🔔',
      label: 'Notifications',
      action: onNotificationOpen,
      className: 'bg-green-500 hover:bg-green-600 text-white'
    },
    {
      icon: '🛡️',
      label: 'Backup Manager',
      action: onBackupOpen,
      className: 'bg-purple-500 hover:bg-purple-600 text-white'
    },
    {
      icon: '🧪',
      label: 'Test Notification',
      action: handleNotificationTest,
      className: 'bg-gray-500 hover:bg-gray-600 text-white'
    }
  ];

  return (
    <>
      {/* Main Floating Action Button */}
      <div ref={fabRef} className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end space-y-3">
          {/* Action buttons */}
          {isExpanded && (
            <div className="flex flex-col items-end space-y-2">
              {fabActions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 group"
                  style={{
                    animation: `slideInRight 0.2s ease-out ${index * 0.05}s both`
                  }}
                >
                  <span className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {action.label}
                  </span>
                  <button
                    onClick={action.action}
                    className={`w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${action.className}`}
                  >
                    <span className="text-lg">{action.icon}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main FAB button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              isExpanded ? 'rotate-45' : ''
            }`}
          >
            <span className="text-2xl">⚡</span>
          </button>
        </div>
      </div>

      {/* Emergency Alert Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🚨</span>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                Emergency Alert
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={emergencyData.location}
                  onChange={(e) => setEmergencyData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Current location (e.g., Main Field, Parking Lot)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Emergency Description *
                </label>
                <textarea
                  value={emergencyData.description}
                  onChange={(e) => setEmergencyData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the emergency situation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Severity Level
                </label>
                <select
                  value={emergencyData.severity}
                  onChange={(e) => setEmergencyData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low - Minor incident</option>
                  <option value="medium">Medium - Requires attention</option>
                  <option value="high">High - Urgent response needed</option>
                  <option value="critical">Critical - Life threatening</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowEmergencyModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={sendEmergencyAlert}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                🚨 Send Alert
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              This will notify all team members and coaches immediately
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default FloatingActionButton;