// Dashboard API Integration
// Handles all communication between the HTML wireframe and backend database

class DashboardAPI {
    constructor() {
        // Use environment variable or fallback to localhost
        this.baseURL = window.FLAGFIT_API_URL ||
                       (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
                       'http://localhost:3001/api';
        this.userId = '1'; // Default user ID for demo
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        this.requestTimeout = 10000; // 10 seconds
    }

    // Generic API call method with timeout and response validation
    async apiCall(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

            // Get authentication token if available
            const token = localStorage.getItem('flagfit_token');
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal,
                ...options
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Validate response is JSON before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not JSON format');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - server took too long to respond');
            }
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Get dashboard overview data
    async getDashboardOverview() {
        const cacheKey = 'dashboard-overview';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/dashboard/overview?userId=${this.userId}`);
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch dashboard overview:', error);
            return this.getFallbackOverview();
        }
    }

    // Get training calendar data
    async getTrainingCalendar() {
        const cacheKey = 'training-calendar';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/dashboard/training-calendar?userId=${this.userId}`);
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch training calendar:', error);
            return this.getFallbackCalendar();
        }
    }

    // Get Olympic qualification data
    async getOlympicQualification() {
        const cacheKey = 'olympic-qualification';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/dashboard/olympic-qualification?userId=${this.userId}`);
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch Olympic data:', error);
            return this.getFallbackOlympicData();
        }
    }

    // Get sponsor rewards data
    async getSponsorRewards() {
        const cacheKey = 'sponsor-rewards';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/dashboard/sponsor-rewards?userId=${this.userId}`);
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch sponsor data:', error);
            return this.getFallbackSponsorData();
        }
    }

    // Get wearables data
    async getWearables() {
        const cacheKey = 'wearables';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/dashboard/wearables?userId=${this.userId}`);
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch wearables data:', error);
            return this.getFallbackWearablesData();
        }
    }

    // Get team chemistry data
    async getTeamChemistry() {
        const cacheKey = 'team-chemistry';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/dashboard/team-chemistry?userId=${this.userId}`);
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch team chemistry data:', error);
            return this.getFallbackChemistryData();
        }
    }

    // Get notifications
    async getNotifications() {
        const cacheKey = 'notifications';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/dashboard/notifications?userId=${this.userId}`);
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            return this.getFallbackNotifications();
        }
    }

    // Get daily quote
    async getDailyQuote() {
        const cacheKey = 'daily-quote';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall('/dashboard/daily-quote');
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch daily quote:', error);
            return this.getFallbackQuote();
        }
    }

    // Cache management
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Fallback data methods (used when API fails)
    getFallbackOverview() {
        return {
            success: true,
            data: {
                trainingProgress: { percentage: 87, completed: 6, trend: '+12% from last week' },
                performanceScore: { score: '8.4', total: 12, status: 'Olympic standard reached' },
                teamChemistry: { overall: '9.1', communication: '9.1', trust: '8.7', status: 'Excellent team synergy' },
                nextSession: { type: 'Olympic preparation training', time: '4:00 PM', duration: 120 }
            }
        };
    }

    getFallbackCalendar() {
        const today = new Date();
        const calendar = [];
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        
        for (let i = -3; i <= 3; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            calendar.push({
                dayName: dayNames[date.getDay()],
                dayDate: date.getDate(),
                dayTraining: i === 0 ? 'Olympic Prep' : 'Rest Day',
                trainingStatus: i === 0 ? 'Active' : 'Scheduled',
                isToday: i === 0,
                isCompleted: i < 0
            });
        }
        
        return { success: true, data: calendar };
    }

    getFallbackOlympicData() {
        return {
            success: true,
            data: {
                qualification: {
                    qualification_probability: 73,
                    world_ranking: 8,
                    days_until_championship: 124
                },
                benchmarks: [
                    { metric_name: '40-Yard Dash', current_value: 4.52, target_value: 4.40, unit: 's' },
                    { metric_name: 'Passing Accuracy', current_value: 82.5, target_value: 85, unit: '%' },
                    { metric_name: 'Agility Shuttle', current_value: 4.18, target_value: 4.00, unit: 's' },
                    { metric_name: 'Game IQ Score', current_value: 87, target_value: 90, unit: '' }
                ]
            }
        };
    }

    getFallbackSponsorData() {
        return {
            success: true,
            data: {
                rewards: {
                    available_points: 2847,
                    current_tier: 'GOLD',
                    products_available: 236,
                    tier_progress_percentage: 65
                },
                products: [
                    { product_name: 'Pro Grip Football Socks', points_cost: 350, relevance_score: 92, category: 'Gear' },
                    { product_name: 'Recovery Massage Gun', points_cost: 1650, relevance_score: 78, category: 'Recovery' },
                    { product_name: 'Elite Training Shorts', points_cost: 780, relevance_score: 89, category: 'Gear' },
                    { product_name: 'Recovery Band Set', points_cost: 420, relevance_score: 94, category: 'Recovery' }
                ]
            }
        };
    }

    getFallbackWearablesData() {
        return {
            success: true,
            data: [{
                device_type: 'Apple Watch',
                heart_rate: 142,
                hrv: 38,
                sleep_score: 87,
                training_load: 247,
                connection_status: 'connected'
            }]
        };
    }

    getFallbackChemistryData() {
        return {
            success: true,
            data: {
                overall_chemistry: 8.4,
                communication_score: 9.1,
                trust_score: 8.7,
                leadership_score: 8.2,
                last_intervention: 'Trust building exercise',
                intervention_effectiveness: 87
            }
        };
    }

    getFallbackNotifications() {
        return {
            success: true,
            data: [
                {
                    notification_type: 'injury_risk',
                    message: 'Injury risk alert: Landing mechanics suboptimal',
                    is_read: false,
                    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    priority: 'high'
                },
                {
                    notification_type: 'weather',
                    message: 'Weather alert: Tomorrow\'s practice moved to 6PM',
                    is_read: false,
                    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    priority: 'medium'
                },
                {
                    notification_type: 'tournament',
                    message: 'European Championship bracket updated',
                    is_read: false,
                    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                    priority: 'low'
                }
            ]
        };
    }

    getFallbackQuote() {
        return {
            success: true,
            data: {
                quote_text: 'Champions aren\'t made in comfort zones. Today\'s training is tomorrow\'s victory.',
                author: 'Coach Marcus Rivera',
                category: 'motivation'
            }
        };
    }
}

// Export for use in HTML
window.DashboardAPI = DashboardAPI;
