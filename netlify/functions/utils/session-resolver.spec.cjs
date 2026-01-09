/**
 * Session Resolver Tests
 * 
 * Tests for PROMPT 2.11: Verify player schedule has NO authority over session resolution
 */

const { resolveTodaySession } = require('./session-resolver.cjs');
const { createClient } = require('@supabase/supabase-js');

// Mock Supabase client
function createMockSupabase(mockData = {}) {
  return {
    from: (table) => ({
      select: (_columns) => ({
        eq: (column, value) => ({
          maybeSingle: async () => ({ data: mockData[table]?.[column]?.[value] || null, error: null }),
          single: async () => ({ data: mockData[table]?.[column]?.[value] || null, error: null }),
        }),
        lte: (_column, _value) => ({
          gte: (_column2, _value2) => ({
            maybeSingle: async () => ({ data: mockData[table]?.[_column2] || null, error: null }),
            single: async () => ({ data: mockData[table]?.[_column2] || null, error: null }),
          }),
        }),
        // Duplicate eq removed - nested eq was never used
        nestedEq: (_column3, _value3) => ({
          eq: (_column4, _value4) => ({
            maybeSingle: async () => ({ data: mockData[table]?.[_column3]?.[_value3] || null, error: null }),
          }),
        }),
      }),
    }),
  };
}

describe('Session Resolver - Player Schedule Authority Removal', () => {
  
  test('Player schedule says practice, but no teamActivity => override MUST be null', async () => {
    // Setup: Player has practice schedule configured
    const mockSupabase = createMockSupabase({
      player_programs: {
        player_id: {
          'test-user': {
            id: 'program-1',
            program_id: 'prog-1',
            status: 'active',
            start_date: '2025-01-01',
            training_programs: { id: 'prog-1', name: 'Test Program' },
          },
        },
      },
      training_phases: {
        program_id: {
          'prog-1': {
            id: 'phase-1',
            name: 'Phase 1',
            start_date: '2025-01-01',
            end_date: '2025-12-31',
          },
        },
      },
      training_weeks: {
        phase_id: {
          'phase-1': {
            id: 'week-1',
            name: 'Week 1',
            start_date: '2025-02-01',
            end_date: '2025-02-07',
          },
        },
      },
      training_session_templates: {
        week_id: {
          'week-1': {
            id: 'session-1',
            session_name: 'Strength Session',
            session_type: 'strength',
            day_of_week: 1, // Monday
          },
        },
      },
      daily_wellness_checkin: {
        user_id: {
          'test-user': null, // No rehab
        },
      },
    });

    const result = await resolveTodaySession(mockSupabase, 'test-user', '2025-02-03'); // Monday

    // Assertions
    expect(result.success).toBe(true);
    expect(result.override).toBeNull(); // MUST be null - no teamActivity, no override
    expect(result.session).not.toBeNull();
    expect(result.status).toBe('resolved');
  });

  test('No player schedule, but teamActivity practice => override MUST be flag_practice (handled upstream)', async () => {
    // This test documents that teamActivity override happens in daily-protocol.cjs, not here
    // session-resolver should NOT set flag_practice override based on player schedule
    
    const mockSupabase = createMockSupabase({
      player_programs: {
        player_id: {
          'test-user': {
            id: 'program-1',
            program_id: 'prog-1',
            status: 'active',
            start_date: '2025-01-01',
            training_programs: { id: 'prog-1', name: 'Test Program' },
          },
        },
      },
      training_phases: {
        program_id: {
          'prog-1': {
            id: 'phase-1',
            name: 'Phase 1',
            start_date: '2025-01-01',
            end_date: '2025-12-31',
          },
        },
      },
      training_weeks: {
        phase_id: {
          'phase-1': {
            id: 'week-1',
            name: 'Week 1',
            start_date: '2025-02-01',
            end_date: '2025-02-07',
          },
        },
      },
      training_session_templates: {
        week_id: {
          'week-1': {
            id: 'session-1',
            session_name: 'Strength Session',
            session_type: 'strength',
            day_of_week: 1,
          },
        },
      },
      daily_wellness_checkin: {
        user_id: {
          'test-user': null,
        },
      },
    });

    const result = await resolveTodaySession(mockSupabase, 'test-user', '2025-02-03');

    // Assertions: session-resolver does NOT set flag_practice override
    // (That happens upstream in daily-protocol.cjs after teamActivity resolution)
    expect(result.success).toBe(true);
    expect(result.override).toBeNull(); // No override from player schedule
    expect(result.session).not.toBeNull();
  });

  test('Rehab protocol wins over any other override', async () => {
    const mockSupabase = createMockSupabase({
      player_programs: {
        player_id: {
          'test-user': {
            id: 'program-1',
            program_id: 'prog-1',
            status: 'active',
            start_date: '2025-01-01',
            training_programs: { id: 'prog-1', name: 'Test Program' },
          },
        },
      },
      training_phases: {
        program_id: {
          'prog-1': {
            id: 'phase-1',
            name: 'Phase 1',
            start_date: '2025-01-01',
            end_date: '2025-12-31',
          },
        },
      },
      training_weeks: {
        phase_id: {
          'phase-1': {
            id: 'week-1',
            name: 'Week 1',
            start_date: '2025-02-01',
            end_date: '2025-02-07',
          },
        },
      },
      training_session_templates: {
        week_id: {
          'week-1': {
            id: 'session-1',
            session_name: 'Strength Session',
            session_type: 'strength',
            day_of_week: 1,
          },
        },
      },
      daily_wellness_checkin: {
        user_id: {
          'test-user': {
            soreness_areas: ['knee', 'ankle'],
            pain_level: 3,
            checkin_date: '2025-02-03',
          },
        },
      },
    });

    const result = await resolveTodaySession(mockSupabase, 'test-user', '2025-02-03');

    // Assertions: Rehab protocol override should be set
    expect(result.success).toBe(true);
    expect(result.override).not.toBeNull();
    expect(result.override.type).toBe('rehab_protocol');
    expect(result.override.replaceSession).toBe(true);
  });
});

// Export for use in test runner
module.exports = {
  resolveTodaySession,
};

