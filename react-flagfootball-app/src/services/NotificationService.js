class NotificationService {
  constructor() {
    this.baseUrl = '/api/notifications';
  }

  // Get all notifications for the user
  async getNotifications(token) {
    try {
      const response = await fetch(this.baseUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark a notification as read
  async markAsRead(notificationId, token) {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(token) {
    try {
      const response = await fetch(`${this.baseUrl}/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Create a new notification (for testing/admin purposes)
  async createNotification(notificationData, token) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId, token) {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get notification preferences
  async getNotificationPreferences(token) {
    try {
      const response = await fetch(`${this.baseUrl}/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences, token) {
    try {
      const response = await fetch(`${this.baseUrl}/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Get user notifications (without token parameter for component usage)
  async getUserNotifications() {
    try {
      // For now, return mock data since we don't have a backend
      return [
        {
          id: '1',
          title: 'Training Reminder',
          message: 'You have a training session scheduled in 30 minutes.',
          type: 'training',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: '2',
          title: 'Nutrition Tip',
          message: 'Remember to stay hydrated during your workout!',
          type: 'nutrition',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          id: '3',
          title: 'Recovery Check-in',
          message: 'How are you feeling after yesterday\'s training?',
          type: 'recovery',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        }
      ];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  // Mark as read (without token parameter)
  async markAsRead(notificationId) {
    try {
      // For now, just log the action
      console.log('Marking notification as read:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all as read (without token parameter)
  async markAllAsRead() {
    try {
      // For now, just log the action
      console.log('Marking all notifications as read');
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification (without token parameter)
  async deleteNotification(notificationId) {
    try {
      // For now, just log the action
      console.log('Deleting notification:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Send notification
  async sendNotification(notificationData) {
    try {
      // For now, just log the action
      console.log('Sending notification:', notificationData);
      return { success: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send emergency notification
  async sendEmergencyNotification(message, priority = 'high') {
    try {
      // For now, just log the action
      console.log('Sending emergency notification:', { message, priority });
      return { success: true };
    } catch (error) {
      console.error('Error sending emergency notification:', error);
      throw error;
    }
  }

  // Get user preferences (without token parameter)
  async getUserPreferences() {
    try {
      // For now, return default preferences
      return {
        email: true,
        push: true,
        sms: false,
        training: true,
        nutrition: true,
        recovery: true,
        team: true,
        system: false
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return {};
    }
  }
}

export default new NotificationService(); 