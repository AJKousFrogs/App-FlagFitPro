import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const OfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [pendingChanges, setPendingChanges] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [offlineData, setOfflineData] = useState({});
  const { user } = useAuth();

  // Backend Integration - Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Backend Integration - Initialize offline storage
  useEffect(() => {
    if (user) {
      initializeOfflineStorage();
      loadOfflineData();
    }
  }, [user]);

  const initializeOfflineStorage = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered');
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  };

  const loadOfflineData = () => {
    const stored = localStorage.getItem('flagfit-offline-data');
    if (stored) {
      try {
        setOfflineData(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing offline data:', error);
        // Clear corrupted data
        localStorage.removeItem('flagfit-offline-data');
        setOfflineData({});
      }
    }
  };

  // Backend Integration - Save data for offline use
  const saveOfflineData = (key, data) => {
    const updatedData = { ...offlineData, [key]: data };
    setOfflineData(updatedData);
    localStorage.setItem('flagfit-offline-data', JSON.stringify(updatedData));
  };

  // Backend Integration - Sync pending changes when online
  const syncPendingChanges = async () => {
    if (!isOnline || pendingChanges.length === 0) return;

    setSyncStatus('syncing');
    
    try {
      for (const change of pendingChanges) {
        await syncChange(change);
      }
      
      setPendingChanges([]);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      
      // Update last sync time in backend
      if (user?.token) {
        await fetch('/api/sync/last-sync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lastSyncTime: new Date().toISOString() })
        });
      }
      
    } catch (error) {
      console.error('Error syncing changes:', error);
      setSyncStatus('error');
    }
  };

  // Backend Integration - Sync individual change
  const syncChange = async (change) => {
    if (!user?.token) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(change.endpoint, {
        method: change.method,
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(change.data)
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  // Backend Integration - Add change to pending queue
  const addPendingChange = (change) => {
    const newChange = {
      ...change,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    setPendingChanges(prev => [...prev, newChange]);

    // Save to offline storage
    try {
      const storedChanges = JSON.parse(localStorage.getItem('flagfit-pending-changes') || '[]');
      storedChanges.push(newChange);
      localStorage.setItem('flagfit-pending-changes', JSON.stringify(storedChanges));
    } catch (error) {
      console.error('Error saving pending changes:', error);
    }
  };

  // Backend Integration - Get offline data
  const getOfflineData = (key) => {
    return offlineData[key] || null;
  };

  // Backend Integration - Check sync status
  const checkSyncStatus = async () => {
    if (!user?.token) return;

    try {
      const response = await fetch('/api/sync/status', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.status);
        setLastSyncTime(data.lastSyncTime ? new Date(data.lastSyncTime) : null);
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
      setSyncStatus('error');
    }
  };

  // Backend Integration - Force sync
  const forceSync = async () => {
    setSyncStatus('syncing');
    await syncPendingChanges();
  };

  // Backend Integration - Clear offline data
  const clearOfflineData = () => {
    setOfflineData({});
    localStorage.removeItem('flagfit-offline-data');
    localStorage.removeItem('flagfit-pending-changes');
    setPendingChanges([]);
  };

  // Minimal UI - Sync status indicator
  return (
    <div className="offline-sync" role="region" aria-label="Offline sync status">
      <div className="sync-status" role="status" aria-live="polite">
        <span className={`status-indicator ${syncStatus}`} aria-hidden="true">
          {syncStatus === 'synced' && '🟢'}
          {syncStatus === 'syncing' && '🔄'}
          {syncStatus === 'offline' && '🔴'}
          {syncStatus === 'error' && '⚠️'}
        </span>

        <span className="status-text">
          {syncStatus === 'synced' && 'Synced'}
          {syncStatus === 'syncing' && 'Syncing...'}
          {syncStatus === 'offline' && 'Offline'}
          {syncStatus === 'error' && 'Sync Error'}
        </span>

        {lastSyncTime && (
          <span className="last-sync">
            Last sync: {lastSyncTime.toLocaleTimeString()}
          </span>
        )}
      </div>

      {pendingChanges.length > 0 && (
        <div className="pending-changes" role="alert">
          <span>📝 {pendingChanges.length} pending changes</span>
          <button
            onClick={forceSync}
            disabled={!isOnline}
            aria-label={`Sync ${pendingChanges.length} pending changes now`}
          >
            Sync Now
          </button>
        </div>
      )}

      {!isOnline && (
        <div className="offline-warning" role="alert">
          ⚠️ You're offline. Changes will sync when connection is restored.
        </div>
      )}

      <div className="offline-actions">
        <button
          onClick={checkSyncStatus}
          aria-label="Check current sync status"
        >
          Check Sync Status
        </button>
        <button
          onClick={forceSync}
          disabled={!isOnline}
          aria-label="Force immediate sync of all changes"
        >
          Force Sync
        </button>
        <button
          onClick={clearOfflineData}
          aria-label="Clear all offline data"
        >
          Clear Offline Data
        </button>
      </div>
    </div>
  );
};

export default OfflineSync; 