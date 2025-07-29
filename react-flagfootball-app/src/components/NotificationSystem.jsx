import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';

const NotificationSystem = memo(() => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Backend Integration - Fetch notifications with cleanup
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user || !isMountedRef.current) return;
    
    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      });
      
      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && isMountedRef.current) {
        console.error('Error fetching notifications:', error);
      }
    }
  }, [user]);

  // Backend Integration - Mark notification as read with cleanup
  const markAsRead = useCallback(async (notificationId) => {
    if (!user || !isMountedRef.current) return;
    
    try {
      const abortController = new AbortController();
      
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        signal: abortController.signal
      });
      
      if (response.ok && isMountedRef.current) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Backend Integration - Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Minimal UI - Notification dropdown
  return (
    <div className="notification-system">
      <button 
        className="notification-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>🔔 Notifications ({unreadCount})</h3>
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">No new notifications</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <div className="notification-type">
                      {notification.type === 'critical' && '🚨 CRITICAL:'}
                      {notification.type === 'performance' && '🏆 PERFORMANCE:'}
                      {notification.type === 'team' && '👥 TEAM:'}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="notification-actions">
                    {notification.actionUrl && (
                      <button 
                        onClick={() => {
                          markAsRead(notification.id);
                          window.location.href = notification.actionUrl;
                        }}
                        className="action-button"
                      >
                        {notification.actionText || 'View Details'}
                      </button>
                    )}
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="dismiss-button"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button onClick={markAllAsRead} className="mark-all-read">
                Mark All Read
              </button>
              <button onClick={() => window.location.href = '/notifications'}>
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

NotificationSystem.displayName = 'NotificationSystem';

export default NotificationSystem; 