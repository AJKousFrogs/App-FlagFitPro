import { fetchWithErrorHandling, createApiHeaders } from '../utils/shared.js';

class NotificationService {
  constructor() {
    this.baseUrl = '/api/notifications';
  }

  // Get all notifications for the user
  async getNotifications(token) {
    return await fetchWithErrorHandling(
      this.baseUrl,
      { headers: createApiHeaders(token) },
      'fetching notifications'
    );
  }

  // Mark a notification as read
  async markAsRead(notificationId, token) {
    return await fetchWithErrorHandling(
      `${this.baseUrl}/${notificationId}/read`,
      { 
        method: 'PUT',
        headers: createApiHeaders(token)
      },
      'marking notification as read'
    );
  }

  // Mark all notifications as read
  async markAllAsRead(token) {
    return await fetchWithErrorHandling(
      `${this.baseUrl}/mark-all-read`,
      { 
        method: 'PUT',
        headers: createApiHeaders(token)
      },
      'marking all notifications as read'
    );
  }

  // Create a new notification (for testing/admin purposes)
  async createNotification(notificationData, token) {
    return await fetchWithErrorHandling(
      this.baseUrl,
      {
        method: 'POST',
        headers: createApiHeaders(token),
        body: JSON.stringify(notificationData)
      },
      'creating notification'
    );
  }

  // Delete a notification
  async deleteNotification(notificationId, token) {
    return await fetchWithErrorHandling(
      `${this.baseUrl}/${notificationId}`,
      {
        method: 'DELETE',
        headers: createApiHeaders(token)
      },
      'deleting notification'
    );
  }

  // Get notification preferences
  async getNotificationPreferences(token) {
    return await fetchWithErrorHandling(
      `${this.baseUrl}/preferences`,
      { headers: createApiHeaders(token) },
      'fetching notification preferences'
    );
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences, token) {
    return await fetchWithErrorHandling(
      `${this.baseUrl}/preferences`,
      {
        method: 'PUT',
        headers: createApiHeaders(token),
        body: JSON.stringify(preferences)
      },
      'updating notification preferences'
    );
  }
}

export default new NotificationService(); 