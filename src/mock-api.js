// Mock API for Static Deployment
// Provides realistic demo data without requiring a backend

export class MockApiClient {
  constructor() {
    this.baseUrl = "mock://api";
    this.delay = 500; // Simulate network delay
  }

  async simulateDelay() {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }

  async get(endpoint) {
    await this.simulateDelay();

    const mockData = this.getMockData(endpoint);
    return {
      success: true,
      data: mockData,
    };
  }

  async post(endpoint, data) {
    await this.simulateDelay();

    if (endpoint.includes("/like") || endpoint.includes("/unlike")) {
      return { success: true };
    }

    if (endpoint.includes("/complete")) {
      return { success: true };
    }

    if (endpoint.includes("/send")) {
      return { success: true };
    }

    if (endpoint.includes("/posts")) {
      return {
        success: true,
        data: { id: Date.now(), ...data },
      };
    }

    return { success: true, data: {} };
  }

  getMockData(endpoint) {
    // Dashboard data
    if (endpoint.includes("/dashboard")) {
      return {
        totalGames: 12,
        winRate: 75,
        totalTouchdowns: 28,
        trainingHours: 45,
        recentActivity: [
          {
            type: "training",
            icon: "🏃",
            title: "Completed Speed Training",
            timeAgo: "2 hours ago",
          },
          {
            type: "game",
            icon: "🏈",
            title: "Won Against Eagles 21-14",
            timeAgo: "1 day ago",
          },
          {
            type: "achievement",
            icon: "🏆",
            title: "Earned MVP Badge",
            timeAgo: "3 days ago",
          },
        ],
        performanceData: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          values: [65, 72, 68, 75, 82, 78, 85],
        },
      };
    }

    // Training data
    if (endpoint.includes("/training")) {
      return {
        weeklyHours: 12,
        totalSessions: 28,
        averageScore: 87,
        currentStreak: 5,
        recentSessions: [
          {
            name: "Speed Training",
            duration: "45 minutes",
            timeAgo: "2 hours ago",
            score: 95,
          },
          {
            name: "Agility Drills",
            duration: "30 minutes",
            timeAgo: "Yesterday",
            score: 88,
          },
          {
            name: "Strength Circuit",
            duration: "60 minutes",
            timeAgo: "2 days ago",
            score: 92,
          },
        ],
        progressData: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          values: [85, 88, 92, 78, 95, 89, 93],
        },
      };
    }

    // Community data
    if (endpoint.includes("/community")) {
      return {
        posts: [
          {
            id: "post1",
            author: "coach@flagfitpro.com",
            authorName: "Coach Mike",
            content:
              "Great practice session today! Keep up the excellent work team! 🏈",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            likes: 24,
            comments: 8,
            shares: 3,
            isLiked: false,
            location: "📍 Training Field",
          },
        ],
      };
    }

    // Tournament data
    if (endpoint.includes("/tournaments")) {
      return {
        tournaments: [
          {
            id: "tournament1",
            name: "Fall Championship",
            description: "Regional Flag Football League",
            status: "Registration Open",
            date: "Oct 15-17",
            duration: "3 days",
            location: "Central Park",
            city: "New York",
            prizePool: 5000,
            registeredTeams: 24,
            maxTeams: 32,
            progressLabel: "Registration Progress",
            progressPercent: 75,
            primaryAction: "register",
            primaryActionText: "Register Team",
          },
          {
            id: "tournament2",
            name: "Summer Slam",
            description: "Elite Division Tournament",
            status: "Live Now",
            date: "Today",
            duration: "Round 2",
            location: "Sports Complex",
            city: "LA",
            prizePool: 10000,
            registeredTeams: 16,
            maxTeams: 16,
            progressLabel: "Tournament Progress",
            progressPercent: 50,
            primaryAction: "watch",
            primaryActionText: "Watch Live",
          },
        ],
        leaderboard: [
          {
            name: "Thunder Bolts",
            wins: 5,
            losses: 0,
            pointsScored: 145,
            points: 2500,
          },
          {
            name: "Storm Chasers",
            wins: 4,
            losses: 1,
            pointsScored: 128,
            points: 2200,
          },
        ],
      };
    }

    // Notifications data
    if (endpoint.includes("/notifications")) {
      return [
        {
          id: 1,
          type: "training",
          title: "Training Session Reminder",
          message: "Speed & Agility training starts in 30 minutes",
          time: "5 minutes ago",
          read: false,
        },
        {
          id: 2,
          type: "achievement",
          title: "New Achievement Unlocked",
          message: "You've completed 10 training sessions this month!",
          time: "1 hour ago",
          read: false,
        },
        {
          id: 3,
          type: "team",
          title: "Team Update",
          message: "New team member joined: Alex Johnson",
          time: "2 hours ago",
          read: false,
        },
      ];
    }

    // Chat/messages data
    if (endpoint.includes("/messages")) {
      return {
        messages: [
          {
            id: "msg1",
            author: "coach@flagfitpro.com",
            authorName: "Coach Mike",
            text: "Great training session everyone!",
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    // Default empty response
    return {};
  }

  setAuthToken(_token) {
    // Mock implementation
  }
}

export const mockApiClient = new MockApiClient();
