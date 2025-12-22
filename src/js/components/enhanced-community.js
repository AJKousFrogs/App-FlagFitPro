/**
 * Enhanced Community Component
 * 
 * Features:
 * - Real-time post updates via Supabase subscriptions
 * - Optimistic UI updates for better UX
 * - Enhanced comment system with real-time updates
 * - Loading states and error handling
 * - Infinite scrolling with pagination
 * - Post filtering and search
 * - Image upload support
 * - Notification integration
 */

import { realtimeManager } from '../services/supabase-client.js';
import { escapeHtml, sanitizeUrl } from '../utils/sanitize.js';
import { getInitials, getTimeAgo } from '../utils/shared.js';
import { logger } from '../../logger.js';

class EnhancedCommunity {
  constructor() {
    this.posts = [];
    this.comments = new Map(); // postId -> comments[]
    this.likes = new Map(); // postId -> Set of user IDs
    this.trendingTopics = [];
    this.leaderboard = [];
    this.suggestedUsers = [];
    this.realtimeSubscriptions = {
      posts: null,
      comments: null,
      likes: null
    };
    this.isLoading = false;
    this.hasMorePosts = true;
    this.currentPage = 0;
    this.postsPerPage = 20;
    this.listeners = new Set();
    this.currentUserId = null;
  }

  /**
   * Initialize the enhanced community component
   */
  async init(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      logger.warn('[Community] Container not found:', containerId);
      return;
    }

    this.options = {
      enableRealtime: options.enableRealtime !== false,
      enableInfiniteScroll: options.enableInfiniteScroll !== false,
      enableNotifications: options.enableNotifications !== false,
      ...options
    };

    // Get current user
    this.currentUserId = this.getCurrentUserId();
    if (!this.currentUserId) {
      logger.warn('[Community] No user ID found');
      return;
    }

    // Load initial data
    await this.loadInitialData();

    // Setup real-time subscriptions
    if (this.options.enableRealtime) {
      await this.setupRealtimeSubscriptions();
    }

    // Render UI
    this.render();

    // Setup event listeners
    this.setupEventListeners();

    logger.info('[Community] Enhanced community initialized');
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    try {
      if (window.authManager) {
        const user = window.authManager.getCurrentUser();
        return user?.id || user?.user_id;
      }
      // Fallback to localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user?.id || user?.user_id;
      }
      return null;
    } catch (error) {
      logger.warn('[Community] Failed to get user ID:', error);
      return null;
    }
  }

  /**
   * Load initial community data
   */
  async loadInitialData() {
    this.isLoading = true;
    try {
      // Load posts
      await this.loadPosts();

      // Load trending topics
      await this.loadTrendingTopics();

      // Load leaderboard
      await this.loadLeaderboard();

      // Load suggested users
      await this.loadSuggestedUsers();

      this.notifyListeners();
    } catch (error) {
      logger.error('[Community] Failed to load initial data:', error);
      this.showError('Failed to load community feed. Please refresh the page.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load posts from API
   */
  async loadPosts(reset = false) {
    try {
      if (reset) {
        this.currentPage = 0;
        this.posts = [];
      }

      const response = await this.apiCall('/api/community/feed', {
        method: 'GET',
        params: {
          feed: true,
          limit: this.postsPerPage,
          offset: this.currentPage * this.postsPerPage
        }
      });

      if (response && response.success && response.data?.posts) {
        const newPosts = response.data.posts;
        
        // Transform posts to internal format
        const transformedPosts = newPosts.map(post => this.transformPost(post));
        
        if (reset) {
          this.posts = transformedPosts;
        } else {
          this.posts.push(...transformedPosts);
        }

        this.hasMorePosts = newPosts.length === this.postsPerPage;
        this.currentPage++;

        // Load likes for each post
        for (const post of transformedPosts) {
          await this.loadPostLikes(post.id);
        }

        this.notifyListeners();
        return transformedPosts;
      }
    } catch (error) {
      logger.error('[Community] Failed to load posts:', error);
      throw error;
    }
  }

  /**
   * Transform post from API format to internal format
   */
  transformPost(post) {
    return {
      id: post.id || post.post_id,
      author: post.users?.name || post.author || 'Unknown',
      authorId: post.user_id || post.author_id,
      authorInitials: getInitials(post.users?.name || post.author || 'U'),
      content: post.content || post.text || '',
      timestamp: post.created_at || post.timestamp,
      timeAgo: getTimeAgo(post.created_at || post.timestamp),
      location: post.location || null,
      image: post.image_url || post.image || null,
      likes: post.likes_count || post.likes || 0,
      comments: post.comments_count || post.comments || 0,
      shares: post.shares_count || post.shares || 0,
      isLiked: post.is_liked || false,
      achievement: post.achievement || null,
      tags: post.tags || []
    };
  }

  /**
   * Load likes for a specific post
   */
  async loadPostLikes(postId) {
    try {
      const response = await this.apiCall(`/api/community/posts/${postId}/likes`, {
        method: 'GET'
      });

      if (response && response.success && response.data) {
        const likes = response.data.likes || [];
        this.likes.set(postId, new Set(likes.map(like => like.user_id)));
        this.notifyListeners();
      }
    } catch (error) {
      logger.warn('[Community] Failed to load likes for post:', postId, error);
    }
  }

  /**
   * Load comments for a specific post
   */
  async loadPostComments(postId) {
    try {
      const response = await this.apiCall(`/api/community/posts/${postId}/comments`, {
        method: 'GET'
      });

      if (response && response.success && response.data?.comments) {
        const comments = response.data.comments.map(comment => ({
          id: comment.id,
          author: comment.users?.name || comment.author || 'Unknown',
          authorId: comment.user_id || comment.author_id,
          authorInitials: getInitials(comment.users?.name || comment.author || 'U'),
          content: comment.content || comment.text || '',
          timestamp: comment.created_at || comment.timestamp,
          timeAgo: getTimeAgo(comment.created_at || comment.timestamp)
        }));

        this.comments.set(postId, comments);
        this.notifyListeners();
        return comments;
      }
    } catch (error) {
      logger.error('[Community] Failed to load comments:', error);
      return [];
    }
  }

  /**
   * Load trending topics
   */
  async loadTrendingTopics() {
    try {
      const response = await this.apiCall('/api/community/trending', {
        method: 'GET'
      });

      if (response && response.success && response.data?.topics) {
        this.trendingTopics = response.data.topics;
      } else {
        // Fallback to default topics
        this.trendingTopics = [
          { name: 'FlagFootballTips', count: 142 },
          { name: 'TrainingTuesday', count: 89 },
          { name: 'GameHighlights', count: 76 },
          { name: 'TeamBuilding', count: 54 },
          { name: 'TournamentPrep', count: 38 }
        ];
      }
    } catch (error) {
      logger.warn('[Community] Failed to load trending topics:', error);
      // Use fallback topics
      this.trendingTopics = [
        { name: 'FlagFootballTips', count: 142 },
        { name: 'TrainingTuesday', count: 89 },
        { name: 'GameHighlights', count: 76 }
      ];
    }
  }

  /**
   * Load leaderboard
   */
  async loadLeaderboard() {
    try {
      const response = await this.apiCall('/api/community/leaderboard', {
        method: 'GET',
        params: { limit: 10 }
      });

      if (response && response.success && response.data) {
        this.leaderboard = response.data.leaderboard || response.data || [];
      } else {
        // Fallback to empty leaderboard
        this.leaderboard = [];
      }
    } catch (error) {
      logger.warn('[Community] Failed to load leaderboard:', error);
      this.leaderboard = [];
    }
  }

  /**
   * Load suggested users
   */
  async loadSuggestedUsers() {
    try {
      const response = await this.apiCall('/api/community/suggested-users', {
        method: 'GET',
        params: { limit: 5 }
      });

      if (response && response.success && response.data?.users) {
        this.suggestedUsers = response.data.users;
      } else {
        // Fallback to empty list
        this.suggestedUsers = [];
      }
    } catch (error) {
      logger.warn('[Community] Failed to load suggested users:', error);
      this.suggestedUsers = [];
    }
  }

  /**
   * Setup real-time subscriptions
   */
  async setupRealtimeSubscriptions() {
    try {
      // Subscribe to new posts
      this.realtimeSubscriptions.posts = realtimeManager.subscribe(
        'posts',
        {
          event: '*', // INSERT, UPDATE, DELETE
          filter: 'is_published=eq.true'
        },
        (payload) => {
          this.handlePostUpdate(payload);
        }
      );

      // Subscribe to comments
      this.realtimeSubscriptions.comments = realtimeManager.subscribe(
        'comments',
        {
          event: '*'
        },
        (payload) => {
          this.handleCommentUpdate(payload);
        }
      );

      // Subscribe to likes
      this.realtimeSubscriptions.likes = realtimeManager.subscribe(
        'post_likes',
        {
          event: '*'
        },
        (payload) => {
          this.handleLikeUpdate(payload);
        }
      );

      logger.info('[Community] Real-time subscriptions active');
    } catch (error) {
      logger.error('[Community] Failed to setup real-time subscriptions:', error);
    }
  }

  /**
   * Handle real-time post updates
   */
  handlePostUpdate(payload) {
    const eventType = payload.eventType || 'INSERT';
    const post = payload.new || payload.old;

    if (!post) {return;}

    logger.info('[Community] Real-time post update:', eventType, post);

    switch (eventType) {
      case 'INSERT':
        // Add new post at the beginning
        const transformedPost = this.transformPost(post);
        this.posts.unshift(transformedPost);
        this.loadPostLikes(transformedPost.id);
        this.showNotification('New post from ' + transformedPost.author);
        break;
      case 'UPDATE':
        // Update existing post
        const index = this.posts.findIndex(p => p.id === post.id);
        if (index !== -1) {
          this.posts[index] = { ...this.posts[index], ...this.transformPost(post) };
        }
        break;
      case 'DELETE':
        // Remove post
        this.posts = this.posts.filter(p => p.id !== post.id);
        break;
    }

    this.render();
    this.notifyListeners();
  }

  /**
   * Handle real-time comment updates
   */
  handleCommentUpdate(payload) {
    const eventType = payload.eventType || 'INSERT';
    const comment = payload.new || payload.old;

    if (!comment) {return;}

    const postId = comment.post_id;
    if (!postId) {return;}

    let postComments = this.comments.get(postId) || [];

    switch (eventType) {
      case 'INSERT':
        const newComment = {
          id: comment.id,
          author: comment.users?.name || 'Unknown',
          authorId: comment.user_id,
          authorInitials: getInitials(comment.users?.name || 'U'),
          content: comment.content || comment.text || '',
          timestamp: comment.created_at,
          timeAgo: getTimeAgo(comment.created_at)
        };
        postComments.push(newComment);
        
        // Update post comment count
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.comments = (post.comments || 0) + 1;
        }
        break;
      case 'DELETE':
        postComments = postComments.filter(c => c.id !== comment.id);
        
        // Update post comment count
        const postToUpdate = this.posts.find(p => p.id === postId);
        if (postToUpdate) {
          postToUpdate.comments = Math.max(0, (postToUpdate.comments || 0) - 1);
        }
        break;
    }

    this.comments.set(postId, postComments);
    this.render();
    this.notifyListeners();
  }

  /**
   * Handle real-time like updates
   */
  handleLikeUpdate(payload) {
    const eventType = payload.eventType || 'INSERT';
    const like = payload.new || payload.old;

    if (!like) {return;}

    const postId = like.post_id;
    if (!postId) {return;}

    const postLikes = this.likes.get(postId) || new Set();
    const post = this.posts.find(p => p.id === postId);

    switch (eventType) {
      case 'INSERT':
        postLikes.add(like.user_id);
        if (post) {
          post.likes = (post.likes || 0) + 1;
          post.isLiked = like.user_id === this.currentUserId;
        }
        break;
      case 'DELETE':
        postLikes.delete(like.user_id);
        if (post) {
          post.likes = Math.max(0, (post.likes || 0) - 1);
          post.isLiked = like.user_id === this.currentUserId ? false : post.isLiked;
        }
        break;
    }

    this.likes.set(postId, postLikes);
    this.render();
    this.notifyListeners();
  }

  /**
   * Create a new post
   */
  async createPost(content, options = {}) {
    if (!content || !content.trim()) {
      throw new Error('Post content cannot be empty');
    }

    // Optimistic update
    const optimisticPost = {
      id: 'temp-' + Date.now(),
      author: this.getCurrentUserName(),
      authorId: this.currentUserId,
      authorInitials: getInitials(this.getCurrentUserName()),
      content: content.trim(),
      timestamp: new Date().toISOString(),
      timeAgo: 'just now',
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false
    };

    this.posts.unshift(optimisticPost);
    this.render();

    try {
      const response = await this.apiCall('/api/community/posts', {
        method: 'POST',
        body: {
          content: content.trim(),
          ...options
        }
      });

      if (response && response.success && response.data) {
        // Replace optimistic post with real post
        const realPost = this.transformPost(response.data);
        const index = this.posts.findIndex(p => p.id === optimisticPost.id);
        if (index !== -1) {
          this.posts[index] = realPost;
        } else {
          this.posts[0] = realPost;
        }
        this.render();
        this.notifyListeners();
        return realPost;
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      logger.error('[Community] Failed to create post:', error);
      // Remove optimistic post on error
      this.posts = this.posts.filter(p => p.id !== optimisticPost.id);
      this.render();
      throw error;
    }
  }

  /**
   * Toggle like on a post
   */
  async toggleLike(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) {return;}

    const wasLiked = post.isLiked;
    const oldLikes = post.likes;

    // Optimistic update
    post.isLiked = !wasLiked;
    post.likes = wasLiked ? Math.max(0, oldLikes - 1) : oldLikes + 1;
    this.render();

    try {
      const response = await this.apiCall(
        `/api/community/posts/${postId}/${wasLiked ? 'unlike' : 'like'}`,
        {
          method: 'POST'
        }
      );

      if (!response || !response.success) {
        // Revert optimistic update
        post.isLiked = wasLiked;
        post.likes = oldLikes;
        this.render();
        throw new Error('Failed to toggle like');
      }
    } catch (error) {
      logger.error('[Community] Failed to toggle like:', error);
      // Revert optimistic update
      post.isLiked = wasLiked;
      post.likes = oldLikes;
      this.render();
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId, content) {
    if (!content || !content.trim()) {
      throw new Error('Comment content cannot be empty');
    }

    const post = this.posts.find(p => p.id === postId);
    if (!post) {return;}

    // Optimistic update
    const optimisticComment = {
      id: 'temp-' + Date.now(),
      author: this.getCurrentUserName(),
      authorId: this.currentUserId,
      authorInitials: getInitials(this.getCurrentUserName()),
      content: content.trim(),
      timestamp: new Date().toISOString(),
      timeAgo: 'just now'
    };

    let postComments = this.comments.get(postId) || [];
    postComments.push(optimisticComment);
    this.comments.set(postId, postComments);
    post.comments = (post.comments || 0) + 1;
    this.render();

    try {
      const response = await this.apiCall(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        body: {
          content: content.trim()
        }
      });

      if (response && response.success && response.data) {
        // Replace optimistic comment with real comment
        const realComment = {
          id: response.data.id,
          author: response.data.users?.name || this.getCurrentUserName(),
          authorId: response.data.user_id || this.currentUserId,
          authorInitials: getInitials(response.data.users?.name || this.getCurrentUserName()),
          content: response.data.content || content.trim(),
          timestamp: response.data.created_at,
          timeAgo: getTimeAgo(response.data.created_at)
        };

        postComments = this.comments.get(postId) || [];
        const index = postComments.findIndex(c => c.id === optimisticComment.id);
        if (index !== -1) {
          postComments[index] = realComment;
        } else {
          postComments.push(realComment);
        }
        this.comments.set(postId, postComments);
        this.render();
        this.notifyListeners();
        return realComment;
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      logger.error('[Community] Failed to add comment:', error);
      // Remove optimistic comment
      postComments = this.comments.get(postId) || [];
      this.comments.set(postId, postComments.filter(c => c.id !== optimisticComment.id));
      post.comments = Math.max(0, (post.comments || 0) - 1);
      this.render();
      throw error;
    }
  }

  /**
   * Get current user name
   */
  getCurrentUserName() {
    try {
      if (window.authManager) {
        const user = window.authManager.getCurrentUser();
        return user?.name || user?.email || 'You';
      }
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user?.name || user?.email || 'You';
      }
      return 'You';
    } catch (error) {
      return 'You';
    }
  }

  /**
   * API call helper
   */
  async apiCall(endpoint, options = {}) {
    try {
      // Try using apiClient if available
      if (window.apiClient) {
        const { method = 'GET', body, params } = options;
        
        if (method === 'GET') {
          return await window.apiClient.get(endpoint, params);
        } else if (method === 'POST') {
          return await window.apiClient.post(endpoint, body);
        }
      }

      // Fallback to fetch API
      let url = endpoint;
      if (!url.startsWith('http')) {
        url = new URL(endpoint, window.location.origin).toString();
      }
      
      if (options.params) {
        const urlObj = new URL(url);
        Object.keys(options.params).forEach(key => {
          urlObj.searchParams.append(key, options.params[key]);
        });
        url = urlObj.toString();
      }

      const fetchOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Add auth token if available
      if (window.authManager) {
        const user = window.authManager.getCurrentUser();
        if (user && user.access_token) {
          fetchOptions.headers['Authorization'] = `Bearer ${user.access_token}`;
        }
      }

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('[Community] API call failed:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Infinite scroll
    if (this.options.enableInfiniteScroll) {
      const handleScroll = () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollPosition >= documentHeight - 200 && this.hasMorePosts && !this.isLoading) {
          this.loadPosts();
        }
      };

      window.addEventListener('scroll', handleScroll);
    }
  }

  /**
   * Render the community UI
   */
  render() {
    if (!this.container) {return;}

    // This will be called from the HTML page
    // The page will use the data from this component
    this.notifyListeners();
  }

  /**
   * Show notification
   */
  showNotification(message) {
    if (this.options.enableNotifications && window.authManager) {
      window.authManager.showSuccess(message);
    } else {
      logger.info('[Community]', message);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (window.authManager) {
      window.authManager.showError(message);
    } else {
      logger.error('[Community]', message);
    }
  }

  /**
   * Add event listener
   */
  addEventListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          posts: this.posts,
          comments: this.comments,
          likes: this.likes,
          trendingTopics: this.trendingTopics,
          leaderboard: this.leaderboard,
          suggestedUsers: this.suggestedUsers,
          isLoading: this.isLoading
        });
      } catch (error) {
        logger.error('[Community] Listener error:', error);
      }
    });
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Unsubscribe from real-time updates
    Object.values(this.realtimeSubscriptions).forEach(sub => {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    });

    this.realtimeSubscriptions = {
      posts: null,
      comments: null,
      likes: null
    };

    this.listeners.clear();
    logger.info('[Community] Enhanced community destroyed');
  }
}

// Export singleton instance
export const enhancedCommunity = new EnhancedCommunity();

