import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  createMockApiResponse, 
  createMockUser, 
  createMockTrainingSession,
  createMockNutritionData,
  createMockPerformanceData,
  createMockOlympicData,
  setupTestEnvironment 
} from '../test-helpers.js'

describe('API Endpoints - Comprehensive Integration Tests', () => {
  let testEnv
  let mockServer
  let authToken

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    authToken = 'test-jwt-token-123'
    
    // Mock fetch globally for all API calls
    global.fetch = vi.fn()
    
    // Setup mock server base configuration
    mockServer = {
      baseURL: 'http://localhost:3001/api',
      endpoints: new Map()
    }
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('Authentication Endpoints', () => {
    describe('POST /auth/login', () => {
      it('should authenticate user with valid credentials', async () => {
        const loginData = { email: 'athlete@flagfit.com', password: 'password123' }
        const mockUser = createMockUser({ email: loginData.email })
        const mockResponse = await createMockApiResponse({
          success: true,
          token: 'jwt-token-abc123',
          user: mockUser,
          expiresIn: 3600
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData)
        })
        
        const result = await response.json()

        expect(response.ok).toBe(true)
        expect(result.success).toBe(true)
        expect(result.token).toBe('jwt-token-abc123')
        expect(result.user.email).toBe(loginData.email)
        expect(result.user.role).toBe('athlete')
      })

      it('should reject invalid credentials', async () => {
        const invalidData = { email: 'wrong@example.com', password: 'wrongpass' }
        const mockResponse = await createMockApiResponse(
          { success: false, error: 'Invalid credentials' },
          { status: 401, ok: false }
        )

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData)
        })

        const result = await response.json()

        expect(response.ok).toBe(false)
        expect(response.status).toBe(401)
        expect(result.error).toBe('Invalid credentials')
      })

      it('should handle rate limiting', async () => {
        const mockResponse = await createMockApiResponse(
          { error: 'Too many attempts. Please try again later.' },
          { 
            status: 429, 
            ok: false,
            headers: new Map([
              ['retry-after', '300'],
              ['x-ratelimit-remaining', '0']
            ])
          }
        )

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@test.com', password: 'pass' })
        })

        expect(response.status).toBe(429)
        expect(response.headers.get('retry-after')).toBe('300')
      })
    })

    describe('POST /auth/register', () => {
      it('should create new user account', async () => {
        const registrationData = {
          email: 'newathlete@flagfit.com',
          password: 'securepass123',
          name: 'New Athlete',
          role: 'athlete',
          profile: {
            position: 'quarterback',
            experience: 'beginner',
            goals: ['fitness', 'competition']
          }
        }

        const mockUser = createMockUser(registrationData)
        const mockResponse = await createMockApiResponse({
          success: true,
          user: mockUser,
          message: 'Account created successfully'
        }, { status: 201 })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrationData)
        })

        const result = await response.json()

        expect(response.status).toBe(201)
        expect(result.success).toBe(true)
        expect(result.user.email).toBe(registrationData.email)
        expect(result.user.profile.position).toBe('quarterback')
      })

      it('should reject duplicate email registration', async () => {
        const mockResponse = await createMockApiResponse(
          { success: false, error: 'Email already exists' },
          { status: 409, ok: false }
        )

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'existing@flagfit.com', password: 'pass123' })
        })

        expect(response.status).toBe(409)
      })
    })

    describe('POST /auth/refresh', () => {
      it('should refresh expired token', async () => {
        const refreshToken = 'refresh-token-xyz'
        const mockResponse = await createMockApiResponse({
          success: true,
          token: 'new-jwt-token-456',
          expiresIn: 3600
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${refreshToken}` }
        })

        const result = await response.json()

        expect(result.success).toBe(true)
        expect(result.token).toBe('new-jwt-token-456')
      })
    })

    describe('POST /auth/logout', () => {
      it('should logout user and invalidate token', async () => {
        const mockResponse = await createMockApiResponse({
          success: true,
          message: 'Logged out successfully'
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        })

        const result = await response.json()

        expect(result.success).toBe(true)
        expect(result.message).toBe('Logged out successfully')
      })
    })
  })

  describe('User Profile Endpoints', () => {
    describe('GET /user/profile', () => {
      it('should return user profile data', async () => {
        const mockUser = createMockUser()
        const mockResponse = await createMockApiResponse({ user: mockUser })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/user/profile`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })

        const result = await response.json()

        expect(result.user.email).toBe('athlete@flagfit.com')
        expect(result.user.profile.position).toBe('wide_receiver')
        expect(result.user.stats.olympicQualificationScore).toBe(78.2)
      })

      it('should require authentication', async () => {
        const mockResponse = await createMockApiResponse(
          { error: 'Authentication required' },
          { status: 401, ok: false }
        )

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/user/profile`)

        expect(response.status).toBe(401)
      })
    })

    describe('PUT /user/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          profile: {
            position: 'safety',
            goals: ['speed', 'agility', 'olympic_qualification'],
            weight: 78,
            height: 185
          },
          preferences: {
            notifications: false,
            privacy: 'private'
          }
        }

        const updatedUser = createMockUser(updateData)
        const mockResponse = await createMockApiResponse({
          success: true,
          user: updatedUser,
          message: 'Profile updated successfully'
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/user/profile`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` 
          },
          body: JSON.stringify(updateData)
        })

        const result = await response.json()

        expect(result.success).toBe(true)
        expect(result.user.profile.position).toBe('safety')
        expect(result.user.profile.weight).toBe(78)
      })

      it('should validate profile data', async () => {
        const invalidData = { profile: { weight: -50, height: 300 } }
        const mockResponse = await createMockApiResponse(
          { 
            success: false, 
            errors: [
              { field: 'weight', message: 'Weight must be positive' },
              { field: 'height', message: 'Height must be realistic' }
            ]
          },
          { status: 400, ok: false }
        )

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/user/profile`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` 
          },
          body: JSON.stringify(invalidData)
        })

        const result = await response.json()

        expect(response.status).toBe(400)
        expect(result.errors).toHaveLength(2)
      })
    })
  })

  describe('Training Session Endpoints', () => {
    describe('POST /training/sessions', () => {
      it('should create new training session', async () => {
        const sessionData = {
          type: 'flag_football_drill',
          date: '2025-01-15',
          duration: 90,
          exercises: [
            {
              name: 'Sprint intervals',
              sets: 6,
              reps: 8,
              distance: '50_yards',
              restTime: 120
            },
            {
              name: 'Route running',
              sets: 10,
              reps: 5,
              notes: 'Focus on precision cuts'
            }
          ],
          intensity: 8.5,
          notes: 'Pre-competition preparation'
        }

        const createdSession = createMockTrainingSession(sessionData)
        const mockResponse = await createMockApiResponse(
          { success: true, session: createdSession },
          { status: 201 }
        )

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/training/sessions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` 
          },
          body: JSON.stringify(sessionData)
        })

        const result = await response.json()

        expect(response.status).toBe(201)
        expect(result.success).toBe(true)
        expect(result.session.type).toBe('flag_football_drill')
        expect(result.session.exercises).toHaveLength(2)
        expect(result.session.olympicImpact).toBe(2.1)
      })

      it('should validate training session data', async () => {
        const invalidData = {
          duration: -30,
          exercises: [],
          intensity: 15
        }

        const mockResponse = await createMockApiResponse(
          { 
            success: false,
            errors: [
              { field: 'duration', message: 'Duration must be positive' },
              { field: 'exercises', message: 'At least one exercise required' },
              { field: 'intensity', message: 'Intensity must be between 1-10' }
            ]
          },
          { status: 400, ok: false }
        )

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/training/sessions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` 
          },
          body: JSON.stringify(invalidData)
        })

        expect(response.status).toBe(400)
      })
    })

    describe('GET /training/sessions', () => {
      it('should return user training sessions', async () => {
        const sessions = [
          createMockTrainingSession({ id: 1, date: '2025-01-15' }),
          createMockTrainingSession({ id: 2, date: '2025-01-14' }),
          createMockTrainingSession({ id: 3, date: '2025-01-13' })
        ]

        const mockResponse = await createMockApiResponse({
          sessions,
          pagination: {
            page: 1,
            limit: 10,
            total: 3,
            hasMore: false
          }
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/training/sessions?page=1&limit=10`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })

        const result = await response.json()

        expect(result.sessions).toHaveLength(3)
        expect(result.pagination.total).toBe(3)
      })

      it('should support filtering by date range', async () => {
        const filteredSessions = [
          createMockTrainingSession({ date: '2025-01-15' })
        ]

        const mockResponse = await createMockApiResponse({
          sessions: filteredSessions,
          filters: {
            startDate: '2025-01-15',
            endDate: '2025-01-15'
          }
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(
          `${mockServer.baseURL}/training/sessions?startDate=2025-01-15&endDate=2025-01-15`,
          { headers: { 'Authorization': `Bearer ${authToken}` } }
        )

        const result = await response.json()

        expect(result.sessions).toHaveLength(1)
        expect(result.filters.startDate).toBe('2025-01-15')
      })
    })

    describe('GET /training/sessions/:id', () => {
      it('should return specific training session', async () => {
        const sessionId = 123
        const session = createMockTrainingSession({ id: sessionId })
        const mockResponse = await createMockApiResponse({ session })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/training/sessions/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })

        const result = await response.json()

        expect(result.session.id).toBe(sessionId)
        expect(result.session.exercises).toHaveLength(2)
      })

      it('should return 404 for non-existent session', async () => {
        const mockResponse = await createMockApiResponse(
          { error: 'Training session not found' },
          { status: 404, ok: false }
        )

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/training/sessions/99999`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })

        expect(response.status).toBe(404)
      })
    })

    describe('PUT /training/sessions/:id', () => {
      it('should update existing training session', async () => {
        const sessionId = 123
        const updateData = {
          notes: 'Updated session notes',
          intensity: 9.0,
          coachFeedback: 'Excellent improvement in speed'
        }

        const updatedSession = createMockTrainingSession({ 
          id: sessionId, 
          ...updateData 
        })

        const mockResponse = await createMockApiResponse({
          success: true,
          session: updatedSession
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/training/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` 
          },
          body: JSON.stringify(updateData)
        })

        const result = await response.json()

        expect(result.success).toBe(true)
        expect(result.session.notes).toBe('Updated session notes')
        expect(result.session.intensity).toBe(9.0)
      })
    })

    describe('DELETE /training/sessions/:id', () => {
      it('should delete training session', async () => {
        const sessionId = 123
        const mockResponse = await createMockApiResponse({
          success: true,
          message: 'Training session deleted successfully'
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/training/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        })

        const result = await response.json()

        expect(result.success).toBe(true)
        expect(result.message).toBe('Training session deleted successfully')
      })
    })
  })

  describe('Nutrition Endpoints', () => {
    describe('POST /nutrition/log', () => {
      it('should log nutrition data', async () => {
        const nutritionData = {
          date: '2025-01-15',
          meals: [
            {
              type: 'breakfast',
              foods: [
                { name: 'Oatmeal', calories: 300, protein: 10, carbs: 50, fat: 6 },
                { name: 'Berries', calories: 80, protein: 1, carbs: 20, fat: 0.5 }
              ]
            }
          ]
        }

        const loggedData = createMockNutritionData(nutritionData)
        const mockResponse = await createMockApiResponse(
          { success: true, nutrition: loggedData },
          { status: 201 }
        )

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/nutrition/log`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` 
          },
          body: JSON.stringify(nutritionData)
        })

        const result = await response.json()

        expect(response.status).toBe(201)
        expect(result.success).toBe(true)
        expect(result.nutrition.analysis.olympicReadiness).toBe('excellent')
      })
    })

    describe('GET /nutrition/analysis', () => {
      it('should return nutrition analysis', async () => {
        const analysisData = {
          period: '7_days',
          averageDailyCalories: 2400,
          macroBreakdown: { protein: 25, carbs: 50, fat: 25 },
          micronutrientStatus: {
            iron: 'adequate',
            vitaminD: 'low',
            vitaminB12: 'excellent'
          },
          recommendations: [
            'Increase vitamin D intake',
            'Consider iron-rich foods',
            'Maintain current protein levels'
          ],
          olympicPreparation: {
            readiness: 'good',
            areas_for_improvement: ['vitamin_d_levels']
          }
        }

        const mockResponse = await createMockApiResponse({ analysis: analysisData })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/nutrition/analysis?period=7_days`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })

        const result = await response.json()

        expect(result.analysis.averageDailyCalories).toBe(2400)
        expect(result.analysis.recommendations).toHaveLength(3)
      })
    })
  })

  describe('Performance Analytics Endpoints', () => {
    describe('GET /analytics/performance', () => {
      it('should return performance analytics', async () => {
        const performanceData = createMockPerformanceData()
        const mockResponse = await createMockApiResponse({ 
          performance: performanceData 
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/analytics/performance?period=30_days`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })

        const result = await response.json()

        expect(result.performance.metrics.speed.improvement).toBe(4.9)
        expect(result.performance.olympicQualification.currentScore).toBe(78.2)
        expect(result.performance.predictions.injuryRisk).toBe('low')
      })
    })

    describe('GET /analytics/olympic', () => {
      it('should return Olympic qualification data', async () => {
        const olympicData = createMockOlympicData()
        const mockResponse = await createMockApiResponse({ 
          olympic: olympicData 
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/analytics/olympic`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })

        const result = await response.json()

        expect(result.olympic.qualification.score).toBe(78.2)
        expect(result.olympic.upcomingEvents).toHaveLength(2)
        expect(result.olympic.athlete.currentRanking).toBe(45)
      })
    })
  })

  describe('AI Coach Endpoints', () => {
    describe('POST /ai/coach/ask', () => {
      it('should respond to coaching questions', async () => {
        const question = "How can I improve my 40-yard dash time?"
        const aiResponse = {
          answer: "To improve your 40-yard dash time, focus on explosive starts, proper running form, and plyometric exercises. Based on your current performance data, I recommend...",
          confidence: 0.95,
          sources: [
            'Sprint Training Research 2024',
            'Olympic Athletic Performance Studies'
          ],
          recommendations: [
            {
              type: 'exercise',
              name: 'Explosive starts practice',
              frequency: '3x per week',
              duration: '20 minutes'
            },
            {
              type: 'technique',
              name: 'Running form drills',
              frequency: '2x per week',
              duration: '15 minutes'
            }
          ],
          followUpQuestions: [
            "Would you like specific drills for explosive starts?",
            "Should I create a sprint training program for you?"
          ]
        }

        const mockResponse = await createMockApiResponse({ 
          response: aiResponse 
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/ai/coach/ask`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` 
          },
          body: JSON.stringify({ question })
        })

        const result = await response.json()

        expect(result.response.confidence).toBe(0.95)
        expect(result.response.recommendations).toHaveLength(2)
        expect(result.response.followUpQuestions).toHaveLength(2)
      })

      it('should handle complex coaching scenarios', async () => {
        const complexQuery = {
          question: "I'm recovering from a minor ankle injury. How should I modify my Olympic preparation training?",
          context: {
            injuryType: 'ankle_sprain',
            severity: 'grade_1',
            timeframe: '2_weeks_ago',
            currentPain: 'minimal',
            upcomingCompetition: '6_weeks'
          }
        }

        const aiResponse = {
          answer: "Given your Grade 1 ankle sprain recovery and upcoming competition, here's a modified training approach...",
          riskAssessment: {
            reinjuryRisk: 'low',
            trainingModifications: 'moderate',
            returnToFullTraining: '1_week'
          },
          modifiedProgram: {
            week1: 'low_impact_conditioning',
            week2: 'progressive_loading',
            week3: 'sport_specific_return'
          },
          precautions: [
            'Avoid lateral movements until pain-free',
            'Use ankle support during training',
            'Ice after sessions'
          ]
        }

        const mockResponse = await createMockApiResponse({ 
          response: aiResponse 
        })

        global.fetch.mockResolvedValue(mockResponse)

        const response = await fetch(`${mockServer.baseURL}/ai/coach/ask`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` 
          },
          body: JSON.stringify(complexQuery)
        })

        const result = await response.json()

        expect(result.response.riskAssessment.reinjuryRisk).toBe('low')
        expect(result.response.precautions).toHaveLength(3)
      })
    })
  })

  describe('Error Handling Across Endpoints', () => {
    it('should handle server errors gracefully', async () => {
      const mockResponse = await createMockApiResponse(
        { error: 'Internal server error' },
        { status: 500, ok: false }
      )

      global.fetch.mockResolvedValue(mockResponse)

      const response = await fetch(`${mockServer.baseURL}/training/sessions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(response.status).toBe(500)
    })

    it('should handle network timeouts', async () => {
      global.fetch.mockRejectedValue(new Error('Network timeout'))

      await expect(
        fetch(`${mockServer.baseURL}/training/sessions`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ).rejects.toThrow('Network timeout')
    })

    it('should handle malformed requests', async () => {
      const mockResponse = await createMockApiResponse(
        { 
          error: 'Malformed JSON in request body',
          details: 'Unexpected token at position 45'
        },
        { status: 400, ok: false }
      )

      global.fetch.mockResolvedValue(mockResponse)

      const response = await fetch(`${mockServer.baseURL}/training/sessions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` 
        },
        body: 'invalid json{'
      })

      expect(response.status).toBe(400)
    })
  })

  describe('API Rate Limiting', () => {
    it('should respect rate limits for expensive operations', async () => {
      const mockResponse = await createMockApiResponse(
        { error: 'Rate limit exceeded for analytics endpoint' },
        { 
          status: 429, 
          ok: false,
          headers: new Map([
            ['retry-after', '60'],
            ['x-ratelimit-remaining', '0'],
            ['x-ratelimit-reset', String(Date.now() + 60000)]
          ])
        }
      )

      global.fetch.mockResolvedValue(mockResponse)

      const response = await fetch(`${mockServer.baseURL}/analytics/performance`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(response.status).toBe(429)
      expect(response.headers.get('retry-after')).toBe('60')
    })
  })

  describe('Data Consistency', () => {
    it('should maintain data consistency across related endpoints', async () => {
      // Create a training session
      const sessionData = createMockTrainingSession()
      const createResponse = await createMockApiResponse(
        { success: true, session: sessionData },
        { status: 201 }
      )

      // Mock fetch for session creation
      global.fetch.mockResolvedValueOnce(createResponse)

      // Get updated performance data that includes the session
      const performanceData = createMockPerformanceData({
        lastTrainingSession: sessionData.id,
        updatedAt: sessionData.date
      })
      
      const performanceResponse = await createMockApiResponse({
        performance: performanceData
      })

      global.fetch.mockResolvedValueOnce(performanceResponse)

      // Create session
      const createResult = await fetch(`${mockServer.baseURL}/training/sessions`, {
        method: 'POST',
        body: JSON.stringify(sessionData)
      })

      // Get performance data
      const performanceResult = await fetch(`${mockServer.baseURL}/analytics/performance`)

      expect(createResult.ok).toBe(true)
      expect(performanceResult.ok).toBe(true)
    })
  })
})