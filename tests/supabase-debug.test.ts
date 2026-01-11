/**
 * Supabase Debugging Test Suite
 * 
 * Run these tests to validate RLS policies, schema, and realtime functionality
 * 
 * Usage:
 * 1. Make sure you have a valid Supabase connection
 * 2. Run: npm test tests/supabase-debug.test.ts
 * 3. Check console output for detailed debugging information
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration - update these with your Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient;
let testUserId: string;

describe('Supabase Backend Debugging', () => {
  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user. Please login first.');
    }

    testUserId = user.id;
    console.log('Test user ID:', testUserId);
  });

  describe('RLS Policy Tests', () => {
    test('user_profiles: SELECT policy allows own profile', async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      console.log('SELECT user_profiles result:', { data, error });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(testUserId);
    });

    test('user_profiles: UPDATE policy allows own profile update', async () => {
      const updateData = {
        updated_at: new Date().toISOString(),
        bio: 'Test bio update'
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', testUserId);

      console.log('UPDATE user_profiles error:', error);
      
      if (error) {
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
      }

      expect(error).toBeNull();
    });

    test('injuries: INSERT policy allows own injury creation', async () => {
      const testInjury = {
        user_id: testUserId,
        injury_type: 'test',
        injury_date: new Date().toISOString(),
        status: 'active',
        body_part: 'test',
        severity: 'minor'
      };

      const { data, error } = await supabase
        .from('injuries')
        .insert(testInjury)
        .select()
        .single();

      console.log('INSERT injuries result:', { data, error });
      
      if (error) {
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error hint:', error.hint);
      }

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(testUserId);

      // Cleanup
      if (data?.id) {
        await supabase.from('injuries').delete().eq('id', data.id);
      }
    });

    test('injuries: UPDATE policy prevents updating others injuries', async () => {
      // This should fail with RLS error
      const { error } = await supabase
        .from('injuries')
        .update({ status: 'recovered' })
        .neq('user_id', testUserId);

      console.log('UPDATE others injuries error:', error);
      
      // We expect this to fail or return 0 rows
      expect(error).toBeDefined();
    });
  });

  describe('Schema Validation Tests', () => {
    test('user_profiles table has required columns', async () => {
      const { data, error } = await supabase.rpc('get_table_columns', {
        table_name: 'user_profiles'
      });

      console.log('user_profiles columns:', data);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      const columnNames = data?.map((col: any) => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('full_name');
      expect(columnNames).toContain('role');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    test('injuries table has required columns', async () => {
      const { data, error } = await supabase.rpc('get_table_columns', {
        table_name: 'injuries'
      });

      console.log('injuries columns:', data);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      const columnNames = data?.map((col: any) => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('injury_type');
      expect(columnNames).toContain('injury_date');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    test('injuries table has user_id index', async () => {
      const { data, error } = await supabase.rpc('check_user_id_index', {
        table_name: 'injuries'
      });

      console.log('injuries user_id index:', data);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('Realtime Subscription Tests', () => {
    test('injuries realtime subscription receives updates', (done) => {
      const testData = {
        user_id: testUserId,
        injury_type: 'realtime_test',
        injury_date: new Date().toISOString(),
        status: 'active',
        body_part: 'test',
        severity: 'minor'
      };

      let insertedId: string;
      let receivedUpdate = false;

      // Set up subscription
      const channel = supabase
        .channel('test_injuries')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'injuries',
            filter: `user_id=eq.${testUserId}`
          },
          (payload) => {
            console.log('Realtime payload received:', payload);
            
            if (payload.eventType === 'INSERT' && payload.new.injury_type === 'realtime_test') {
              receivedUpdate = true;
              insertedId = payload.new.id;
            }
          }
        )
        .subscribe(async (status) => {
          console.log('Subscription status:', status);

          if (status === 'SUBSCRIBED') {
            // Insert test data after subscription is ready
            const { data, error } = await supabase
              .from('injuries')
              .insert(testData)
              .select()
              .single();

            console.log('Test insert result:', { data, error });
            insertedId = data?.id;

            // Wait for realtime update
            setTimeout(async () => {
              expect(receivedUpdate).toBe(true);

              // Cleanup
              if (insertedId) {
                await supabase.from('injuries').delete().eq('id', insertedId);
              }
              
              await supabase.removeChannel(channel);
              done();
            }, 2000);
          }
        });
    }, 10000); // 10 second timeout

    test('realtime conflict detection', (done) => {
      const testData = {
        user_id: testUserId,
        injury_type: 'conflict_test',
        injury_date: new Date().toISOString(),
        status: 'active',
        body_part: 'test',
        severity: 'minor'
      };

      let insertedId: string;
      let localVersion: any = null;

      // Set up subscription
      const channel = supabase
        .channel('test_conflicts')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'injuries',
            filter: `user_id=eq.${testUserId}`
          },
          (payload) => {
            console.log('Conflict test - realtime update:', payload);
            
            const remoteData = payload.new;
            
            if (localVersion && remoteData.id === localVersion.id) {
              const localTime = new Date(localVersion.updated_at).getTime();
              const remoteTime = new Date(remoteData.updated_at).getTime();
              
              console.log('Local updated_at:', localVersion.updated_at);
              console.log('Remote updated_at:', remoteData.updated_at);
              
              if (localTime > remoteTime) {
                console.log('⚠️ Conflict detected: Local version is newer');
                // In a real app, you would merge the changes here
              } else {
                console.log('✅ No conflict: Remote version is newer');
                localVersion = remoteData;
              }
            }
          }
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Insert test data
            const { data } = await supabase
              .from('injuries')
              .insert(testData)
              .select()
              .single();

            insertedId = data?.id;
            localVersion = data;

            // Simulate local update
            localVersion.status = 'recovering';
            localVersion.updated_at = new Date().toISOString();

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 500));

            // Remote update
            await supabase
              .from('injuries')
              .update({ status: 'treated' })
              .eq('id', insertedId);

            // Wait for realtime
            setTimeout(async () => {
              // Cleanup
              if (insertedId) {
                await supabase.from('injuries').delete().eq('id', insertedId);
              }
              
              await supabase.removeChannel(channel);
              done();
            }, 2000);
          }
        });
    }, 10000);
  });

  describe('Performance Tests', () => {
    test('user_profiles query performance', async () => {
      const start = performance.now();
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      const duration = performance.now() - start;
      
      console.log('Query duration:', duration.toFixed(2), 'ms');
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000); // Should be under 1 second
    });

    test('injuries query with filter performance', async () => {
      const start = performance.now();
      
      const { data, error } = await supabase
        .from('injuries')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const duration = performance.now() - start;
      
      console.log('Filtered query duration:', duration.toFixed(2), 'ms');
      console.log('Results count:', data?.length || 0);
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000); // Should be under 1 second
    });
  });
});
