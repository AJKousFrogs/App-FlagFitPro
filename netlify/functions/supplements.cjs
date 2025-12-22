// Netlify Function: Supplements API
// Handles supplement logging (read-only for AI - no dosing recommendations)

const { baseHandler } = require('./utils/base-handler.cjs');
const { createSuccessResponse, createErrorResponse } = require('./utils/error-handler.cjs');
const { supabaseAdmin } = require('./supabase-client.cjs');

/**
 * Log supplement usage
 * POST /api/supplements/log
 * Note: AI can read logs but never writes dosing recommendations
 */
async function logSupplement(userId, supplementData) {
  try {
    const {
      supplement,
      dose,
      takenAt,
      notes
    } = supplementData;

    // Validate required fields
    if (!supplement || typeof supplement !== 'string' || supplement.trim().length === 0) {
      throw new Error('supplement name is required');
    }

    // Validate supplement name length
    if (supplement.length > 100) {
      throw new Error('supplement name must be 100 characters or less');
    }

    // Note: dose is optional - user logs it, but AI never recommends it
    if (dose !== undefined && dose !== null) {
      if (typeof dose !== 'number' || dose < 0) {
        throw new Error('dose must be a positive number if provided');
      }
    }

    // Parse takenAt or use current time
    const takenAtDate = takenAt ? new Date(takenAt) : new Date();

    // Insert supplement log
    const { data, error } = await supabaseAdmin
      .from('supplements_logs')
      .insert({
        user_id: userId,
        supplement: supplement.trim(),
        dose: dose || null,
        taken_at: takenAtDate.toISOString(),
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging supplement:', error);
      throw error;
    }

    return {
      id: data.id,
      loggedAt: data.created_at,
      supplement: data.supplement,
      dose: data.dose,
      takenAt: data.taken_at,
      notes: data.notes
    };
  } catch (error) {
    console.error('Error in logSupplement:', error);
    throw error;
  }
}

/**
 * Get supplement logs for user
 * GET /api/supplements/logs
 */
async function getSupplementLogs(userId, limit = 30) {
  try {
    const { data, error } = await supabaseAdmin
      .from('supplements_logs')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching supplement logs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSupplementLogs:', error);
    throw error;
  }
}

/**
 * Get recent supplement logs (last 7 days)
 * GET /api/supplements/recent
 */
async function getRecentSupplementLogs(userId) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabaseAdmin
      .from('supplements_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('taken_at', sevenDaysAgo.toISOString())
      .order('taken_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent supplement logs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentSupplementLogs:', error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  // Extract sub-path
  const path = event.path.replace("/.netlify/functions/supplements", "");

  return baseHandler(event, context, {
    functionName: 'supplements',
    allowedMethods: ['GET', 'POST'],
    rateLimitType: event.httpMethod === 'POST' ? 'CREATE' : 'READ',
    handler: async (event, context, { userId }) => {
      if (event.httpMethod === 'POST') {
        // Handle POST /api/supplements/log
        if (path.includes('/log') || path.endsWith('/log')) {
          let supplementData = {};
          try {
            supplementData = JSON.parse(event.body || '{}');
          } catch (parseError) {
            return createErrorResponse('Invalid JSON in request body', 400, 'invalid_json');
          }

          const result = await logSupplement(userId, supplementData);
          return createSuccessResponse(result, 201, 'Supplement logged');
        }

        return createErrorResponse('Endpoint not found', 404, 'not_found');
      }

      // Handle GET requests
      if (path.includes('/recent') || path.endsWith('/recent')) {
        const result = await getRecentSupplementLogs(userId);
        return createSuccessResponse({ logs: result });
      }

      if (path.includes('/logs') || path.endsWith('/logs')) {
        const limit = parseInt(event.queryStringParameters?.limit) || 30;
        const result = await getSupplementLogs(userId, limit);
        return createSuccessResponse({ logs: result });
      }

      // Default: return recent logs
      const result = await getRecentSupplementLogs(userId);
      return createSuccessResponse({ logs: result });
    }
  });
};

