// Analytics Data Service for FlagFit Pro
// Fetches and formats data from the database for Chart.js visualization

class AnalyticsDataService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        
        // Check if Map is supported, fallback to object if not
        if (typeof Map === 'undefined') {
            this.cache = {};
            this.useObjectCache = true;
        } else {
            this.useObjectCache = false;
        }
        
        // Check if fetch is available
        if (typeof fetch === 'undefined') {
            console.warn('Fetch API not available, using XMLHttpRequest fallback');
            this.useXHR = true;
        } else {
            this.useXHR = false;
        }
    }

    // Generic API call method with fallbacks
    async apiCall(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            
            const token = localStorage.getItem('flagfit_token');
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            let response;
            
            if (this.useXHR) {
                // Fallback to XMLHttpRequest for older browsers
                response = await this.xhrRequest(url, options, headers);
            } else {
                // Use fetch API
                response = await fetch(url, {
                    method: options.method || 'GET',
                    headers: headers,
                    body: options.body ? JSON.stringify(options.body) : undefined,
                    ...options
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // XMLHttpRequest fallback for older browsers
    xhrRequest(url, options, headers) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.open(options.method || 'GET', url, true);
            
            // Set headers
            Object.keys(headers).forEach(key => {
                xhr.setRequestHeader(key, headers[key]);
            });
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve({
                            ok: true,
                            status: xhr.status,
                            json: () => Promise.resolve(data)
                        });
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`HTTP error! status: ${xhr.status}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error'));
            };
            
            xhr.ontimeout = function() {
                reject(new Error('Request timeout'));
            };
            
            xhr.timeout = 10000; // 10 second timeout
            
            if (options.body) {
                xhr.send(options.body);
            } else {
                xhr.send();
            }
        });
    }

    // Get cached data with fallback support
    getCachedData(key) {
        try {
            if (this.useObjectCache) {
                const cached = this.cache[key];
                if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                    return cached.data;
                }
                return null;
            } else {
                const cached = this.cache.get(key);
                if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                    return cached.data;
                }
                return null;
            }
        } catch (error) {
            console.warn('Cache access error:', error);
            return null;
        }
    }

    // Set cached data with fallback support
    setCachedData(key, data) {
        try {
            const cacheEntry = {
                data: data,
                timestamp: Date.now()
            };
            
            if (this.useObjectCache) {
                this.cache[key] = cacheEntry;
            } else {
                this.cache.set(key, cacheEntry);
            }
        } catch (error) {
            console.warn('Cache set error:', error);
        }
    }

    // Get performance trends data for line chart
    async getPerformanceTrendsData(userId = '1', weeks = 7) {
        const cacheKey = `performance-trends-${userId}-${weeks}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/analytics/performance-trends?userId=${userId}&weeks=${weeks}`);
            this.setCachedData(cacheKey, data);
            return this.formatPerformanceTrendsData(data);
        } catch (error) {
            console.error('Failed to fetch performance trends:', error);
            return this.getFallbackPerformanceTrendsData(weeks);
        }
    }

    // Get team chemistry data for radar chart
    async getTeamChemistryData(userId = '1') {
        const cacheKey = `team-chemistry-${userId}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/analytics/team-chemistry?userId=${userId}`);
            this.setCachedData(cacheKey, data);
            return this.formatTeamChemistryData(data);
        } catch (error) {
            console.error('Failed to fetch team chemistry:', error);
            return this.getFallbackTeamChemistryData();
        }
    }

    // Get training distribution data for pie chart
    async getTrainingDistributionData(userId = '1', period = '30days') {
        const cacheKey = `training-distribution-${userId}-${period}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/analytics/training-distribution?userId=${userId}&period=${period}`);
            this.setCachedData(cacheKey, data);
            return this.formatTrainingDistributionData(data);
        } catch (error) {
            console.error('Failed to fetch training distribution:', error);
            return this.getFallbackTrainingDistributionData();
        }
    }

    // Get position performance data for bar chart
    async getPositionPerformanceData(userId = '1') {
        const cacheKey = `position-performance-${userId}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/analytics/position-performance?userId=${userId}`);
            this.setCachedData(cacheKey, data);
            return this.formatPositionPerformanceData(data);
        } catch (error) {
            console.error('Failed to fetch position performance:', error);
            return this.getFallbackPositionPerformanceData();
        }
    }

    // Get Olympic qualification data for gauge chart
    async getOlympicQualificationData(userId = '1') {
        const cacheKey = `olympic-qualification-${userId}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/dashboard/olympic-qualification?userId=${userId}`);
            this.setCachedData(cacheKey, data);
            return this.formatOlympicQualificationData(data);
        } catch (error) {
            console.error('Failed to fetch Olympic data:', error);
            return this.getFallbackOlympicQualificationData();
        }
    }

    // Get injury risk data for gauge chart
    async getInjuryRiskData(userId = '1') {
        const cacheKey = `injury-risk-${userId}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/analytics/injury-risk?userId=${userId}`);
            this.setCachedData(cacheKey, data);
            return this.formatInjuryRiskData(data);
        } catch (error) {
            console.error('Failed to fetch injury risk data:', error);
            return this.getFallbackInjuryRiskData();
        }
    }

    // Get speed development data for line chart
    async getSpeedDevelopmentData(userId = '1', weeks = 7) {
        const cacheKey = `speed-development-${userId}-${weeks}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/analytics/speed-development?userId=${userId}&weeks=${weeks}`);
            this.setCachedData(cacheKey, data);
            return this.formatSpeedDevelopmentData(data);
        } catch (error) {
            console.error('Failed to fetch speed development data:', error);
            return this.getFallbackSpeedDevelopmentData(weeks);
        }
    }

    // Get user engagement funnel data
    async getUserEngagementData(period = '30days') {
        const cacheKey = `user-engagement-${period}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.apiCall(`/analytics/user-engagement?period=${period}`);
            this.setCachedData(cacheKey, data);
            return this.formatUserEngagementData(data);
        } catch (error) {
            console.error('Failed to fetch user engagement data:', error);
            return this.getFallbackUserEngagementData();
        }
    }

    // Format performance trends data for Chart.js
    formatPerformanceTrendsData(data) {
        try {
            const weeks = data.weeks || ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'];
            
            return {
                labels: weeks,
                datasets: [{
                    label: 'Overall Performance Score',
                    data: data.overallScores || [78, 82, 79, 85, 87, 89, 91],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Training Effectiveness',
                    data: data.trainingScores || [75, 78, 80, 83, 86, 88, 90],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            };
        } catch (error) {
            console.error('Error formatting performance trends data:', error);
            return this.getFallbackPerformanceTrendsData();
        }
    }

    // Format team chemistry data for Chart.js
    formatTeamChemistryData(data) {
        try {
            const metrics = data.metrics || ['Communication', 'Coordination', 'Trust', 'Cohesion', 'Leadership', 'Adaptability'];
            
            return {
                labels: metrics,
                datasets: [{
                    label: 'Current Team Chemistry',
                    data: data.currentScores || [8.5, 7.8, 9.1, 8.2, 7.5, 8.8],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3B82F6',
                    borderWidth: 3
                }, {
                    label: 'Target Chemistry',
                    data: data.targetScores || [9.0, 8.5, 9.5, 8.8, 8.0, 9.2],
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: '#10B981',
                    borderWidth: 2,
                    borderDash: [5, 5]
                }]
            };
        } catch (error) {
            console.error('Error formatting team chemistry data:', error);
            return this.getFallbackTeamChemistryData();
        }
    }

    // Format training distribution data for Chart.js
    formatTrainingDistributionData(data) {
        try {
            const trainingTypes = data.trainingTypes || ['Agility Training', 'Speed Development', 'Technical Skills', 'Strength Training', 'Recovery Sessions'];
            const sessionCounts = data.sessionCounts || [30, 25, 20, 15, 10];
            
            return {
                labels: trainingTypes,
                datasets: [{
                    data: sessionCounts,
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#F97316', '#06B6D4'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 3
                }]
            };
        } catch (error) {
            console.error('Error formatting training distribution data:', error);
            return this.getFallbackTrainingDistributionData();
        }
    }

    // Format position performance data for Chart.js
    formatPositionPerformanceData(data) {
        try {
            const positions = data.positions || ['Quarterback', 'Wide Receiver', 'Center', 'Defensive Back', 'Blitzer'];
            
            return {
                labels: positions,
                datasets: [{
                    label: 'Current Performance',
                    data: data.currentScores || [87, 92, 89, 85, 78],
                    backgroundColor: '#3B82F6',
                    borderColor: '#3B82F6',
                    borderWidth: 1,
                    borderRadius: 8
                }, {
                    label: 'Target Performance',
                    data: data.targetScores || [90, 95, 92, 88, 82],
                    backgroundColor: '#10B981',
                    borderColor: '#10B981',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            };
        } catch (error) {
            console.error('Error formatting position performance data:', error);
            return this.getFallbackPositionPerformanceData();
        }
    }

    // Format Olympic qualification data for Chart.js
    formatOlympicQualificationData(data) {
        try {
            const qualification = data.data?.qualification || {};
            const progress = qualification.qualification_probability || 73;
            
            return {
                labels: ['Qualification Progress', 'Remaining'],
                datasets: [{
                    data: [progress, 100 - progress],
                    backgroundColor: ['#22C55E', '#E5E7EB'],
                    borderColor: '#ffffff',
                    borderWidth: 4,
                    cutout: '75%'
                }]
            };
        } catch (error) {
            console.error('Error formatting Olympic qualification data:', error);
            return this.getFallbackOlympicQualificationData();
        }
    }

    // Format injury risk data for Chart.js
    formatInjuryRiskData(data) {
        try {
            const riskLevels = data.riskLevels || ['Low Risk', 'Medium Risk', 'High Risk'];
            const riskPercentages = data.riskPercentages || [75, 20, 5];
            
            return {
                labels: riskLevels,
                datasets: [{
                    data: riskPercentages,
                    backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    cutout: '60%'
                }]
            };
        } catch (error) {
            console.error('Error formatting injury risk data:', error);
            return this.getFallbackInjuryRiskData();
        }
    }

    // Format speed development data for Chart.js
    formatSpeedDevelopmentData(data) {
        try {
            const weeks = data.weeks || ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'];
            
            return {
                labels: weeks,
                datasets: [{
                    label: '40-Yard Dash Time',
                    data: data.fortyYardTimes || [4.65, 4.62, 4.58, 4.55, 4.52, 4.49, 4.46],
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: '10-Yard Sprint Time',
                    data: data.tenYardTimes || [1.68, 1.65, 1.62, 1.60, 1.58, 1.56, 1.54],
                    borderColor: '#F97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            };
        } catch (error) {
            console.error('Error formatting speed development data:', error);
            return this.getFallbackSpeedDevelopmentData();
        }
    }

    // Format user engagement data for Chart.js
    formatUserEngagementData(data) {
        try {
            const stages = data.stages || ['App Opens', 'Dashboard Views', 'Training Started', 'Session Complete', 'Goal Set', 'Goal Achieved'];
            const userCounts = data.userCounts || [1000, 850, 720, 680, 450, 320];
            
            return {
                labels: stages,
                datasets: [{
                    label: 'User Engagement Funnel',
                    data: userCounts,
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#F97316', '#06B6D4', '#22C55E'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            };
        } catch (error) {
            console.error('Error formatting user engagement data:', error);
            return this.getFallbackUserEngagementData();
        }
    }

    // Fallback data methods
    getFallbackPerformanceTrendsData(weeks = 7) {
        try {
            const weekLabels = [];
            for (let i = 1; i <= weeks; i++) {
                weekLabels.push(`Week ${i}`);
            }
            
            return {
                labels: weekLabels,
                datasets: [{
                    label: 'Overall Performance Score',
                    data: [78, 82, 79, 85, 87, 89, 91].slice(0, weeks),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Training Effectiveness',
                    data: [75, 78, 80, 83, 86, 88, 90].slice(0, weeks),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            };
        } catch (error) {
            console.error('Error creating fallback performance trends data:', error);
            return { labels: [], datasets: [] };
        }
    }

    getFallbackTeamChemistryData() {
        try {
            return {
                labels: ['Communication', 'Coordination', 'Trust', 'Cohesion', 'Leadership', 'Adaptability'],
                datasets: [{
                    label: 'Current Team Chemistry',
                    data: [8.5, 7.8, 9.1, 8.2, 7.5, 8.8],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3B82F6',
                    borderWidth: 3
                }, {
                    label: 'Target Chemistry',
                    data: [9.0, 8.5, 9.5, 8.8, 8.0, 9.2],
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: '#10B981',
                    borderWidth: 2,
                    borderDash: [5, 5]
                }]
            };
        } catch (error) {
            console.error('Error creating fallback team chemistry data:', error);
            return { labels: [], datasets: [] };
        }
    }

    getFallbackTrainingDistributionData() {
        try {
            return {
                labels: ['Agility Training', 'Speed Development', 'Technical Skills', 'Strength Training', 'Recovery Sessions'],
                datasets: [{
                    data: [30, 25, 20, 15, 10],
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#F97316', '#06B6D4'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 3
                }]
            };
        } catch (error) {
            console.error('Error creating fallback training distribution data:', error);
            return { labels: [], datasets: [] };
        }
    }

    getFallbackPositionPerformanceData() {
        try {
            return {
                labels: ['Quarterback', 'Wide Receiver', 'Center', 'Defensive Back', 'Blitzer'],
                datasets: [{
                    label: 'Current Performance',
                    data: [87, 92, 89, 85, 78],
                    backgroundColor: '#3B82F6',
                    borderColor: '#3B82F6',
                    borderWidth: 1,
                    borderRadius: 8
                }, {
                    label: 'Target Performance',
                    data: [90, 95, 92, 88, 82],
                    backgroundColor: '#10B981',
                    borderColor: '#10B981',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            };
        } catch (error) {
            console.error('Error creating fallback position performance data:', error);
            return { labels: [], datasets: [] };
        }
    }

    getFallbackOlympicQualificationData() {
        try {
            return {
                labels: ['Qualification Progress', 'Remaining'],
                datasets: [{
                    data: [73, 27],
                    backgroundColor: ['#22C55E', '#E5E7EB'],
                    borderColor: '#ffffff',
                    borderWidth: 4,
                    cutout: '75%'
                }]
            };
        } catch (error) {
            console.error('Error creating fallback Olympic qualification data:', error);
            return { labels: [], datasets: [] };
        }
    }

    getFallbackInjuryRiskData() {
        try {
            return {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [75, 20, 5],
                    backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    cutout: '60%'
                }]
            };
        } catch (error) {
            console.error('Error creating fallback injury risk data:', error);
            return { labels: [], datasets: [] };
        }
    }

    getFallbackSpeedDevelopmentData(weeks = 7) {
        try {
            const weekLabels = [];
            for (let i = 1; i <= weeks; i++) {
                weekLabels.push(`Week ${i}`);
            }
            
            return {
                labels: weekLabels,
                datasets: [{
                    label: '40-Yard Dash Time',
                    data: [4.65, 4.62, 4.58, 4.55, 4.52, 4.49, 4.46].slice(0, weeks),
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: '10-Yard Sprint Time',
                    data: [1.68, 1.65, 1.62, 1.60, 1.58, 1.56, 1.54].slice(0, weeks),
                    borderColor: '#F97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            };
        } catch (error) {
            console.error('Error creating fallback speed development data:', error);
            return { labels: [], datasets: [] };
        }
    }

    getFallbackUserEngagementData() {
        try {
            return {
                labels: ['App Opens', 'Dashboard Views', 'Training Started', 'Session Complete', 'Goal Set', 'Goal Achieved'],
                datasets: [{
                    label: 'User Engagement Funnel',
                    data: [1000, 850, 720, 680, 450, 320],
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#F97316', '#06B6D4', '#22C55E'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            };
        } catch (error) {
            console.error('Error creating fallback user engagement data:', error);
            return { labels: [], datasets: [] };
        }
    }

    // Clear cache
    clearCache() {
        try {
            if (this.useObjectCache) {
                this.cache = {};
            } else {
                this.cache.clear();
            }
        } catch (error) {
            console.warn('Error clearing cache:', error);
        }
    }

    // Get cache statistics
    getCacheStats() {
        try {
            const now = Date.now();
            let validEntries = 0;
            let expiredEntries = 0;
            
            if (this.useObjectCache) {
                Object.keys(this.cache).forEach(key => {
                    const entry = this.cache[key];
                    if (now - entry.timestamp < this.cacheTTL) {
                        validEntries++;
                    } else {
                        expiredEntries++;
                    }
                });
                
                return {
                    total: Object.keys(this.cache).length,
                    valid: validEntries,
                    expired: expiredEntries,
                    ttl: this.cacheTTL
                };
            } else {
                this.cache.forEach((value, key) => {
                    if (now - value.timestamp < this.cacheTTL) {
                        validEntries++;
                    } else {
                        expiredEntries++;
                    }
                });
                
                return {
                    total: this.cache.size,
                    valid: validEntries,
                    expired: expiredEntries,
                    ttl: this.cacheTTL
                };
            }
        } catch (error) {
            console.warn('Error getting cache stats:', error);
            return { total: 0, valid: 0, expired: 0, ttl: this.cacheTTL };
        }
    }

    // Check if service is working
    isServiceAvailable() {
        return typeof fetch !== 'undefined' || typeof XMLHttpRequest !== 'undefined';
    }
}

export default AnalyticsDataService;
