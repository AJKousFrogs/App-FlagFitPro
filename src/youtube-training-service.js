// YouTube Training Video Service
// Integrates with YouTube Data API v3 for flag football and sprinting training videos

class YouTubeTrainingService {
    constructor() {
        // For production, these would be environment variables
        this.apiKey = process.env.YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY_HERE';
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
        this.channelAllowlist = [
            'UCblfuW_4rakIf2h6aqANefA', // World Athletics
            'UCTlO2AY8O9cKpR7qSWwBhXg', // Track & Field Training
            'UCK8BNXL9nDTIl-FBFdoxVsA', // Speed Training
            'UC6MXDJpW_HZy3nj94QLp0gg', // Flag Football Central
            'UCZrxgx23pJ0jZGdKDHf_mFQ'  // Athletic Performance
        ];
        this.cache = new Map();
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    }

    // Training video categories for flag football athletes
    getTrainingCategories() {
        return {
            'warm-up': {
                name: 'Warm-up & Activation',
                keywords: [
                    'dynamic warm up running',
                    'A skips B skips C skips',
                    'sprint warm up drills',
                    'athletic warm up routine',
                    'pre practice warm up',
                    'flag football warm up',
                    'track field warm up'
                ],
                duration: '5-15 minutes',
                description: 'Essential warm-up movements for sprint preparation'
            },
            'sprint-drills': {
                name: 'Sprint Technique',
                keywords: [
                    'sprint technique drills',
                    'running form drills',
                    'acceleration drills',
                    'sprint mechanics',
                    'speed training drills',
                    'track and field sprinting'
                ],
                duration: '10-20 minutes',
                description: 'Technical drills to improve sprint speed and form'
            },
            'agility': {
                name: 'Agility & Change of Direction',
                keywords: [
                    'agility ladder drills',
                    'cone drills football',
                    'change of direction drills',
                    'flag football agility',
                    'cutting drills',
                    'lateral movement drills'
                ],
                duration: '15-25 minutes',
                description: 'Drills to improve agility and field movement'
            },
            'plyometrics': {
                name: 'Power & Plyometrics',
                keywords: [
                    'plyometric exercises',
                    'jump training',
                    'power development',
                    'explosive training',
                    'vertical jump training',
                    'sprint power drills'
                ],
                duration: '15-30 minutes',
                description: 'Explosive power development for speed'
            },
            'flag-specific': {
                name: 'Flag Football Specific',
                keywords: [
                    'flag football drills',
                    'flag pulling technique',
                    'flag football routes',
                    'flag football defense',
                    'flag football skills',
                    'non contact football'
                ],
                duration: '20-40 minutes',
                description: 'Sport-specific skills and techniques'
            },
            'cool-down': {
                name: 'Cool-down & Recovery',
                keywords: [
                    'cool down stretches',
                    'post workout stretching',
                    'recovery routine',
                    'static stretching',
                    'foam rolling',
                    'athlete recovery'
                ],
                duration: '10-20 minutes',
                description: 'Recovery and injury prevention routines'
            }
        };
    }

    // Get cached videos or fetch from YouTube
    async getTrainingVideos(category, maxResults = 12) {
        const cacheKey = `${category}-${maxResults}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                console.log(`📺 Using cached videos for ${category}`);
                return cached.data;
            }
        }

        try {
            const videos = await this.fetchVideosFromYouTube(category, maxResults);
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: videos,
                timestamp: Date.now()
            });

            return videos;
        } catch (error) {
            console.error(`❌ Error fetching ${category} videos:`, error);
            
            // Return fallback/demo videos if API fails
            return this.getFallbackVideos(category);
        }
    }

    // Fetch videos from YouTube Data API
    async fetchVideosFromYouTube(category, maxResults) {
        const categories = this.getTrainingCategories();
        const categoryData = categories[category];
        
        if (!categoryData) {
            throw new Error(`Unknown category: ${category}`);
        }

        console.log(`📺 Fetching ${category} videos from YouTube...`);

        const allVideos = [];
        
        // Search with multiple keywords to get diverse results
        for (const keyword of categoryData.keywords.slice(0, 3)) { // Limit to 3 keywords to avoid rate limits
            try {
                const videos = await this.searchVideos(keyword, Math.ceil(maxResults / 3));
                allVideos.push(...videos);
            } catch (error) {
                console.warn(`⚠️ Failed to fetch videos for "${keyword}":`, error.message);
            }
        }

        // Remove duplicates and filter for quality
        const uniqueVideos = this.filterAndSortVideos(allVideos, maxResults);
        
        console.log(`✅ Found ${uniqueVideos.length} videos for ${category}`);
        return uniqueVideos;
    }

    // Search YouTube for specific keywords
    async searchVideos(query, maxResults = 4) {
        const url = new URL(`${this.baseUrl}/search`);
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('q', query);
        url.searchParams.set('type', 'video');
        url.searchParams.set('order', 'relevance');
        url.searchParams.set('maxResults', maxResults.toString());
        url.searchParams.set('videoDuration', 'short,medium'); // Filter out very long videos
        url.searchParams.set('videoDefinition', 'high');
        url.searchParams.set('key', this.apiKey);

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
            query: query
        }));
    }

    // Filter and sort videos for quality and relevance
    filterAndSortVideos(videos, maxResults) {
        // Remove duplicates by video ID
        const uniqueVideos = videos.filter((video, index, self) => 
            index === self.findIndex(v => v.id === video.id)
        );

        // Score videos based on quality indicators
        const scoredVideos = uniqueVideos.map(video => ({
            ...video,
            score: this.calculateVideoScore(video)
        }));

        // Sort by score and return top results
        return scoredVideos
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);
    }

    // Calculate quality score for video ranking
    calculateVideoScore(video) {
        let score = 0;

        // Prefer videos from trusted channels
        if (this.channelAllowlist.includes(video.channelId)) {
            score += 10;
        }

        // Quality indicators in title
        const title = video.title.toLowerCase();
        const qualityKeywords = [
            'technique', 'proper', 'form', 'drills', 'training',
            'tutorial', 'guide', 'coaching', 'instruction'
        ];
        
        qualityKeywords.forEach(keyword => {
            if (title.includes(keyword)) score += 2;
        });

        // Prefer more recent videos (within 2 years)
        const publishDate = new Date(video.publishedAt);
        const ageInMonths = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (ageInMonths < 24) {
            score += Math.max(0, 5 - (ageInMonths / 12));
        }

        // Penalize videos with poor quality indicators
        const lowQualityIndicators = [
            'reaction', 'funny', 'fails', 'compilation',
            'music', 'song', 'entertainment'
        ];
        
        lowQualityIndicators.forEach(indicator => {
            if (title.includes(indicator)) score -= 3;
        });

        return score;
    }

    // Fallback videos when API is unavailable
    getFallbackVideos(category) {
        const fallbackData = {
            'warm-up': [
                {
                    id: 'demo1',
                    title: 'Dynamic Warm-up for Sprinters - A, B, C Skips',
                    description: 'Complete warm-up routine including A skips, B skips, and C skips for sprint preparation.',
                    thumbnail: 'https://img.youtube.com/vi/demo1/maxresdefault.jpg',
                    channelTitle: 'Track & Field Training',
                    url: '#',
                    embedUrl: '#',
                    score: 8,
                    fallback: true
                },
                {
                    id: 'demo2',
                    title: 'Sprint Warm-up Drills - Complete Routine',
                    description: 'Professional warm-up sequence for flag football and sprint training.',
                    thumbnail: 'https://img.youtube.com/vi/demo2/maxresdefault.jpg',
                    channelTitle: 'Athletic Performance',
                    url: '#',
                    embedUrl: '#',
                    score: 7,
                    fallback: true
                }
            ],
            'sprint-drills': [
                {
                    id: 'demo3',
                    title: 'Sprint Technique Fundamentals',
                    description: 'Essential sprint mechanics and form improvements.',
                    thumbnail: 'https://img.youtube.com/vi/demo3/maxresdefault.jpg',
                    channelTitle: 'Speed Training',
                    url: '#',
                    embedUrl: '#',
                    score: 9,
                    fallback: true
                }
            ],
            'agility': [
                {
                    id: 'demo4',
                    title: 'Flag Football Agility Drills',
                    description: 'Change of direction and cutting drills for flag football.',
                    thumbnail: 'https://img.youtube.com/vi/demo4/maxresdefault.jpg',
                    channelTitle: 'Flag Football Central',
                    url: '#',
                    embedUrl: '#',
                    score: 8,
                    fallback: true
                }
            ]
        };

        return fallbackData[category] || [];
    }

    // Get curated video playlist for a complete training session
    async getTrainingPlaylist(sessionType = 'complete') {
        const playlists = {
            'complete': ['warm-up', 'sprint-drills', 'agility', 'cool-down'],
            'speed-focused': ['warm-up', 'sprint-drills', 'plyometrics', 'cool-down'],
            'agility-focused': ['warm-up', 'agility', 'flag-specific', 'cool-down'],
            'recovery': ['warm-up', 'cool-down'],
            'game-prep': ['warm-up', 'flag-specific', 'agility', 'cool-down']
        };

        const categories = playlists[sessionType] || playlists['complete'];
        const playlist = [];

        for (const category of categories) {
            const videos = await this.getTrainingVideos(category, 2);
            playlist.push({
                category: category,
                categoryName: this.getTrainingCategories()[category].name,
                videos: videos
            });
        }

        return playlist;
    }

    // Search for specific exercise or technique
    async searchSpecificExercise(exerciseName, maxResults = 6) {
        const enhancedQuery = `${exerciseName} tutorial technique training`;
        
        try {
            const videos = await this.searchVideos(enhancedQuery, maxResults);
            return this.filterAndSortVideos(videos, maxResults);
        } catch (error) {
            console.error(`❌ Error searching for ${exerciseName}:`, error);
            return this.getFallbackVideos('sprint-drills').slice(0, maxResults);
        }
    }

    // Get video details with additional metadata
    async getVideoDetails(videoId) {
        try {
            const url = new URL(`${this.baseUrl}/videos`);
            url.searchParams.set('part', 'snippet,statistics,contentDetails');
            url.searchParams.set('id', videoId);
            url.searchParams.set('key', this.apiKey);

            const response = await fetch(url);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const video = data.items[0];
                return {
                    id: video.id,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    thumbnail: video.snippet.thumbnails.medium?.url,
                    channelTitle: video.snippet.channelTitle,
                    duration: this.parseDuration(video.contentDetails.duration),
                    viewCount: parseInt(video.statistics.viewCount || 0),
                    likeCount: parseInt(video.statistics.likeCount || 0),
                    publishedAt: video.snippet.publishedAt,
                    url: `https://www.youtube.com/watch?v=${video.id}`,
                    embedUrl: `https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`
                };
            }
        } catch (error) {
            console.error(`❌ Error fetching video details for ${videoId}:`, error);
        }

        return null;
    }

    // Parse YouTube duration format (PT4M13S) to readable format
    parseDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return 'Unknown';

        const hours = match[1] ? parseInt(match[1]) : 0;
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const seconds = match[3] ? parseInt(match[3]) : 0;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Check if API key is configured
    isConfigured() {
        return this.apiKey && this.apiKey !== 'YOUR_YOUTUBE_API_KEY_HERE';
    }

    // Get API usage statistics
    getApiUsageStats() {
        return {
            cacheSize: this.cache.size,
            cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
            isConfigured: this.isConfigured()
        };
    }
}

// Export singleton instance
export const youTubeTrainingService = new YouTubeTrainingService();
export default YouTubeTrainingService;