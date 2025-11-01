// Supabase client for Netlify Functions
// Handles database connections and operations

const { createClient } = require('@supabase/supabase-js');

// Environment variables (set in Netlify UI)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service key for admin operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Anon key for regular operations

// Create Supabase client with service key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client with anon key for regular operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operations helper
const db = {
  // User operations
  users: {
    async findByEmail(email) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data;
    },

    async create(userData) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async findById(id) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Training operations
  training: {
    async getUserStats(userId) {
      const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async createSession(sessionData) {
      const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .insert(sessionData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async getRecentSessions(userId, limit = 10) {
      const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    }
  },

  // Team operations
  teams: {
    async getUserTeams(userId) {
      const { data, error } = await supabaseAdmin
        .from('team_members')
        .select(`
          *,
          teams:team_id (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    },

    async getTeamMembers(teamId) {
      const { data, error } = await supabaseAdmin
        .from('team_members')
        .select(`
          *,
          users:user_id (
            id,
            name,
            email,
            role,
            avatar_url
          )
        `)
        .eq('team_id', teamId);
      
      if (error) throw error;
      return data || [];
    }
  },

  // Community operations
  community: {
    async getFeedPosts(limit = 20) {
      const { data, error } = await supabaseAdmin
        .from('posts')
        .select(`
          *,
          users:user_id (
            id,
            name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },

    async createPost(postData) {
      const { data, error } = await supabaseAdmin
        .from('posts')
        .insert(postData)
        .select(`
          *,
          users:user_id (
            id,
            name,
            avatar_url
          )
        `)
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Tournament operations
  tournaments: {
    async getList(status = 'all', limit = 20) {
      let query = supabaseAdmin
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: true })
        .limit(limit);
      
      if (status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },

    async getDetails(tournamentId) {
      const { data, error } = await supabaseAdmin
        .from('tournaments')
        .select(`
          *,
          tournament_registrations (
            *,
            teams:team_id (
              id,
              name
            )
          )
        `)
        .eq('id', tournamentId)
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Games operations
  games: {
    async getRecentGames(teamId = null, limit = 10) {
      let query = supabaseAdmin
        .from('games')
        .select(`
          *,
          home_team:home_team_id (
            id,
            name
          ),
          away_team:away_team_id (
            id,
            name
          )
        `)
        .order('game_date', { ascending: false })
        .limit(limit);
      
      if (teamId) {
        query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  },

  // Chat operations
  chat: {
    async getMessages(channel, limit = 50) {
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .select(`
          *,
          users:user_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('channel', channel)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data?.reverse() || []; // Reverse to show oldest first
    },

    async createMessage(messageData) {
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .insert(messageData)
        .select(`
          *,
          users:user_id (
            id,
            name,
            avatar_url
          )
        `)
        .single();
      
      if (error) throw error;
      return data;
    }
  }
};

// Helper function to check if environment variables are configured
function checkEnvVars() {
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables. Please set SUPABASE_URL, SUPABASE_SERVICE_KEY, and SUPABASE_ANON_KEY in Netlify.');
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  db,
  checkEnvVars
};