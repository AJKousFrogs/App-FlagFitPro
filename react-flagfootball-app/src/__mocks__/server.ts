/**
 * Mock Service Worker (MSW) server for API mocking in tests
 * Provides comprehensive API mocking for enterprise-grade testing
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { User, Team, TrainingSession, Tournament, APIResponse } from '../types';

// Mock data
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  displayName: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  role: 'player',
  permissions: ['user:read', 'training:read'],
  profileComplete: true,
  emailVerified: true,
  phoneNumber: '+1234567890',
  dateOfBirth: '1995-01-01',
  position: 'quarterback',
  preferences: {
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    notifications: {
      email: true,
      push: true,
      sms: false,
      training: true,
      tournaments: true,
      teamUpdates: true,
      marketing: false,
    },
    privacy: {
      profileVisibility: 'public',
      showStats: true,
      showPosition: true,
      allowMessaging: true,
    },
    units: 'imperial',
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-12-01T00:00:00.000Z',
  lastLoginAt: '2023-12-01T12:00:00.000Z',
};

const mockTeam: Team = {
  id: 'team-123',
  name: 'Test Warriors',
  code: 'TW',
  logo: 'https://example.com/team-logo.png',
  colors: {
    primary: '#FF0000',
    secondary: '#000000',
  },
  league: {
    id: 'league-123',
    name: 'Test League',
    level: 'recreational',
    season: '2023-2024',
    rules: {
      playersPerTeam: 7,
      fieldSize: {
        length: 100,
        width: 53,
        endZoneDepth: 10,
        units: 'yards',
      },
      gameDuration: 60,
      flagPullingRules: 'Standard flag pulling rules apply',
    },
  },
  coach: mockUser,
  players: [mockUser],
  stats: {
    wins: 5,
    losses: 2,
    ties: 1,
    winPercentage: 68.75,
    pointsFor: 156,
    pointsAgainst: 98,
    totalYards: 1250,
    passingYards: 850,
    rushingYards: 400,
    turnovers: 8,
    penalties: 15,
    averageScore: 19.5,
    homeRecord: '3-1-0',
    awayRecord: '2-1-1',
    divisionRecord: '4-1-1',
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-12-01T00:00:00.000Z',
};

const mockTrainingSession: TrainingSession = {
  id: 'training-123',
  title: 'Speed and Agility Training',
  description: 'Focus on improving speed and agility for better field performance',
  type: 'speed',
  intensity: 'high',
  duration: 90,
  location: 'Main Training Field',
  equipment: ['cones', 'agility-ladder', 'hurdles'],
  exercises: [
    {
      id: 'exercise-123',
      name: '40-Yard Dash',
      description: 'Sprint 40 yards as fast as possible',
      type: 'cardio',
      muscleGroups: ['legs', 'glutes'],
      equipment: ['cones'],
      instructions: [
        'Start in 3-point stance',
        'Sprint as fast as possible',
        'Run through the finish line',
      ],
      sets: 3,
      reps: 1,
      restPeriod: 120,
    },
  ],
  participants: [mockUser],
  coach: mockUser,
  scheduledAt: '2023-12-15T10:00:00.000Z',
  status: 'scheduled',
  createdAt: '2023-12-01T00:00:00.000Z',
  updatedAt: '2023-12-01T00:00:00.000Z',
};

const mockTournament: Tournament = {
  id: 'tournament-123',
  name: 'Winter Championship',
  description: 'Annual winter championship tournament',
  type: 'single-elimination',
  format: 'team',
  status: 'open',
  startDate: '2023-12-20T00:00:00.000Z',
  endDate: '2023-12-22T00:00:00.000Z',
  location: {
    name: 'Central Sports Complex',
    address: '123 Sports Ave',
    city: 'Sports City',
    state: 'SC',
    country: 'USA',
    zipCode: '12345',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060,
    },
    facilities: ['Field 1', 'Field 2', 'Locker Rooms', 'Concessions'],
  },
  entryFee: 100,
  prizePool: 5000,
  maxTeams: 16,
  registeredTeams: [mockTeam],
  rules: {
    gameFormat: '7v7 Flag Football',
    playingTime: 40,
    timeouts: 2,
    overtimeRules: 'Sudden death overtime',
    eligibilityRules: ['All players must be registered', 'Age restrictions apply'],
    equipmentRequirements: ['Mouth guards required', 'No metal cleats'],
    penaltyRules: ['Standard NFL flag football penalties'],
  },
  organizer: mockUser,
  createdAt: '2023-11-01T00:00:00.000Z',
  updatedAt: '2023-12-01T00:00:00.000Z',
};

// Request handlers
const handlers = [
  // Authentication endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<APIResponse<{ user: User; tokens: any }>>({
        success: true,
        data: {
          user: mockUser,
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 3600000,
            tokenType: 'Bearer',
          },
        },
        message: 'Login successful',
        timestamp: Date.now(),
        requestId: 'req-123',
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json<APIResponse<{ user: User; tokens: any }>>({
        success: true,
        data: {
          user: mockUser,
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 3600000,
            tokenType: 'Bearer',
          },
        },
        message: 'Registration successful',
        timestamp: Date.now(),
        requestId: 'req-124',
      })
    );
  }),

  rest.post('/api/auth/refresh', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<APIResponse<any>>({
        success: true,
        data: {
          accessToken: 'new-mock-access-token',
          expiresAt: Date.now() + 3600000,
        },
        timestamp: Date.now(),
        requestId: 'req-125',
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<APIResponse<null>>({
        success: true,
        data: null,
        message: 'Logout successful',
        timestamp: Date.now(),
        requestId: 'req-126',
      })
    );
  }),

  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          error: 'Unauthorized',
          message: 'No valid token provided',
          statusCode: 401,
          timestamp: Date.now(),
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json<APIResponse<User>>({
        success: true,
        data: mockUser,
        timestamp: Date.now(),
        requestId: 'req-127',
      })
    );
  }),

  // User endpoints
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json<APIResponse<User>>({
        success: true,
        data: { ...mockUser, id: id as string },
        timestamp: Date.now(),
        requestId: 'req-128',
      })
    );
  }),

  rest.put('/api/users/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<APIResponse<User>>({
        success: true,
        data: mockUser,
        message: 'User updated successfully',
        timestamp: Date.now(),
        requestId: 'req-129',
      })
    );
  }),

  // Team endpoints
  rest.get('/api/teams', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<APIResponse<Team[]>>({
        success: true,
        data: [mockTeam],
        timestamp: Date.now(),
        requestId: 'req-130',
      })
    );
  }),

  rest.get('/api/teams/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json<APIResponse<Team>>({
        success: true,
        data: { ...mockTeam, id: id as string },
        timestamp: Date.now(),
        requestId: 'req-131',
      })
    );
  }),

  // Training endpoints
  rest.get('/api/training/sessions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<APIResponse<TrainingSession[]>>({
        success: true,
        data: [mockTrainingSession],
        timestamp: Date.now(),
        requestId: 'req-132',
      })
    );
  }),

  rest.post('/api/training/sessions', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json<APIResponse<TrainingSession>>({
        success: true,
        data: mockTrainingSession,
        message: 'Training session created successfully',
        timestamp: Date.now(),
        requestId: 'req-133',
      })
    );
  }),

  // Tournament endpoints
  rest.get('/api/tournaments', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<APIResponse<Tournament[]>>({
        success: true,
        data: [mockTournament],
        timestamp: Date.now(),
        requestId: 'req-134',
      })
    );
  }),

  rest.get('/api/tournaments/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json<APIResponse<Tournament>>({
        success: true,
        data: { ...mockTournament, id: id as string },
        timestamp: Date.now(),
        requestId: 'req-135',
      })
    );
  }),

  // Health check endpoint
  rest.get('/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'ok',
        timestamp: Date.now(),
        version: '1.0.0',
      })
    );
  }),

  // Dashboard endpoints
  rest.get('/api/dashboard/overview', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<APIResponse<any>>({
        success: true,
        data: {
          stats: {
            totalGames: 8,
            wins: 5,
            losses: 2,
            ties: 1,
            winPercentage: 68.75,
          },
          recentActivity: [
            {
              id: 'activity-1',
              type: 'training',
              description: 'Completed speed training session',
              timestamp: '2023-12-01T10:00:00.000Z',
            },
            {
              id: 'activity-2',
              type: 'game',
              description: 'Won against Thunder Bolts 21-14',
              timestamp: '2023-11-28T14:00:00.000Z',
            },
          ],
          upcomingEvents: [
            {
              id: 'event-1',
              type: 'training',
              title: 'Agility Training',
              datetime: '2023-12-15T10:00:00.000Z',
            },
            {
              id: 'event-2',
              type: 'tournament',
              title: 'Winter Championship',
              datetime: '2023-12-20T00:00:00.000Z',
            },
          ],
        },
        timestamp: Date.now(),
        requestId: 'req-136',
      })
    );
  }),

  // Error simulation endpoints
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        statusCode: 500,
        timestamp: Date.now(),
      })
    );
  }),

  rest.get('/api/error/404', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: 'Not Found',
        message: 'The requested resource was not found',
        statusCode: 404,
        timestamp: Date.now(),
      })
    );
  }),

  // Slow response endpoint for testing loading states
  rest.get('/api/slow', (req, res, ctx) => {
    return res(
      ctx.delay(2000),
      ctx.status(200),
      ctx.json<APIResponse<any>>({
        success: true,
        data: { message: 'This was a slow response' },
        timestamp: Date.now(),
        requestId: 'req-slow',
      })
    );
  }),
];

// Create server instance
export const server = setupServer(...handlers);

// Export mock data for use in tests
export {
  mockUser,
  mockTeam,
  mockTrainingSession,
  mockTournament,
};

// Export helper functions for test setup
export const setupMockServer = () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
};

export const mockApiError = (endpoint: string, status: number, error: any) => {
  server.use(
    rest.get(endpoint, (req, res, ctx) => {
      return res(
        ctx.status(status),
        ctx.json({
          success: false,
          error: error.name || 'Error',
          message: error.message || 'An error occurred',
          statusCode: status,
          timestamp: Date.now(),
        })
      );
    })
  );
};

export const mockApiSuccess = (endpoint: string, data: any) => {
  server.use(
    rest.get(endpoint, (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json<APIResponse<any>>({
          success: true,
          data,
          timestamp: Date.now(),
          requestId: `mock-${Date.now()}`,
        })
      );
    })
  );
};