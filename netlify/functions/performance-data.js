// Netlify Functions - Performance Data API
// Handles athlete performance data storage and retrieval

const { MongoClient } = require('mongodb');

// Mock database for demo (replace with actual MongoDB connection)
let mockDB = {
    measurements: [],
    performanceTests: [],
    wellness: [],
    supplements: [],
    injuries: []
};

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        const { httpMethod, path, body, queryStringParameters } = event;
        const pathSegments = path.split('/').filter(Boolean);
        const endpoint = pathSegments[pathSegments.length - 1];

        // Parse authorization header
        const authHeader = event.headers.authorization;
        const userId = parseAuthToken(authHeader); // Mock auth for demo

        if (!userId) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        let response;

        switch (endpoint) {
            case 'measurements':
                response = await handleMeasurements(httpMethod, userId, body, queryStringParameters);
                break;
            case 'performance-tests':
                response = await handlePerformanceTests(httpMethod, userId, body, queryStringParameters);
                break;
            case 'wellness':
                response = await handleWellness(httpMethod, userId, body, queryStringParameters);
                break;
            case 'supplements':
                response = await handleSupplements(httpMethod, userId, body, queryStringParameters);
                break;
            case 'injuries':
                response = await handleInjuries(httpMethod, userId, body, queryStringParameters);
                break;
            case 'trends':
                response = await handleTrends(httpMethod, userId, queryStringParameters);
                break;
            case 'export':
                response = await handleExport(userId, queryStringParameters);
                break;
            default:
                response = { statusCode: 404, body: JSON.stringify({ error: 'Endpoint not found' }) };
        }

        return {
            ...response,
            headers: { ...corsHeaders, ...response.headers }
        };

    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Physical Measurements Handler
async function handleMeasurements(method, userId, body, query) {
    switch (method) {
        case 'GET':
            const timeframe = query?.timeframe || '6m';
            const measurements = mockDB.measurements.filter(m => 
                m.userId === userId && 
                isWithinTimeframe(m.timestamp, timeframe)
            );
            return {
                statusCode: 200,
                body: JSON.stringify({
                    data: measurements,
                    summary: calculateMeasurementsSummary(measurements)
                })
            };

        case 'POST':
            const measurementData = JSON.parse(body);
            const newMeasurement = {
                id: generateId(),
                userId,
                ...measurementData,
                timestamp: new Date().toISOString()
            };
            
            // Validate data
            const errors = validateMeasurementData(measurementData);
            if (errors.length > 0) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ errors })
                };
            }

            mockDB.measurements.push(newMeasurement);
            return {
                statusCode: 201,
                body: JSON.stringify({ 
                    success: true, 
                    id: newMeasurement.id,
                    data: newMeasurement
                })
            };

        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
}

// Performance Tests Handler
async function handlePerformanceTests(method, userId, body, query) {
    switch (method) {
        case 'GET':
            const testType = query?.testType;
            const timeframe = query?.timeframe || '12m';
            
            let tests = mockDB.performanceTests.filter(t => 
                t.userId === userId && 
                isWithinTimeframe(t.timestamp, timeframe)
            );

            if (testType) {
                tests = tests.filter(t => t.testType === testType);
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    data: tests,
                    trends: calculatePerformanceTrends(tests),
                    summary: calculateTestsSummary(tests)
                })
            };

        case 'POST':
            const testData = JSON.parse(body);
            const newTest = {
                id: generateId(),
                userId,
                ...testData,
                timestamp: new Date().toISOString()
            };

            mockDB.performanceTests.push(newTest);
            return {
                statusCode: 201,
                body: JSON.stringify({ 
                    success: true, 
                    id: newTest.id,
                    improvement: calculateImprovement(testData.testType, testData.result, userId)
                })
            };

        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
}

// Wellness Data Handler
async function handleWellness(method, userId, body, query) {
    switch (method) {
        case 'GET':
            const timeframe = query?.timeframe || '30d';
            const wellness = mockDB.wellness.filter(w => 
                w.userId === userId && 
                isWithinTimeframe(w.date, timeframe)
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    data: wellness,
                    averages: calculateWellnessAverages(wellness),
                    patterns: detectWellnessPatterns(wellness)
                })
            };

        case 'POST':
            const wellnessData = JSON.parse(body);
            const newWellness = {
                id: generateId(),
                userId,
                ...wellnessData,
                timestamp: new Date().toISOString()
            };

            mockDB.wellness.push(newWellness);
            return {
                statusCode: 201,
                body: JSON.stringify({ 
                    success: true, 
                    id: newWellness.id 
                })
            };

        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
}

// Supplements Handler
async function handleSupplements(method, userId, body, query) {
    switch (method) {
        case 'GET':
            const timeframe = query?.timeframe || '30d';
            const supplements = mockDB.supplements.filter(s => 
                s.userId === userId && 
                isWithinTimeframe(s.date, timeframe)
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    data: supplements,
                    compliance: calculateSupplementCompliance(supplements)
                })
            };

        case 'POST':
            const supplementData = JSON.parse(body);
            const newSupplement = {
                id: generateId(),
                userId,
                ...supplementData,
                timestamp: new Date().toISOString()
            };

            mockDB.supplements.push(newSupplement);
            return {
                statusCode: 201,
                body: JSON.stringify({ 
                    success: true, 
                    id: newSupplement.id 
                })
            };

        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
}

// Injuries Handler
async function handleInjuries(method, userId, body, query) {
    switch (method) {
        case 'GET':
            const status = query?.status; // active, recovered, all
            let injuries = mockDB.injuries.filter(i => i.userId === userId);
            
            if (status && status !== 'all') {
                injuries = injuries.filter(i => i.status === status);
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    data: injuries,
                    statistics: calculateInjuryStatistics(injuries)
                })
            };

        case 'POST':
            const injuryData = JSON.parse(body);
            const newInjury = {
                id: generateId(),
                userId,
                status: 'active',
                ...injuryData,
                reportedAt: new Date().toISOString()
            };

            mockDB.injuries.push(newInjury);
            return {
                statusCode: 201,
                body: JSON.stringify({ 
                    success: true, 
                    id: newInjury.id 
                })
            };

        case 'PATCH':
            const updateData = JSON.parse(body);
            const pathSegments = query.path.split('/');
            const injuryId = pathSegments[pathSegments.length - 1];
            
            const injuryIndex = mockDB.injuries.findIndex(i => 
                i.id === injuryId && i.userId === userId
            );

            if (injuryIndex === -1) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Injury not found' })
                };
            }

            mockDB.injuries[injuryIndex] = {
                ...mockDB.injuries[injuryIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    success: true, 
                    data: mockDB.injuries[injuryIndex]
                })
            };

        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
}

// Trends Analysis Handler
async function handleTrends(method, userId, query) {
    if (method !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const timeframe = query?.timeframe || '12m';
    
    // Gather all data for trend analysis
    const measurements = mockDB.measurements.filter(m => 
        m.userId === userId && isWithinTimeframe(m.timestamp, timeframe)
    );
    
    const performanceTests = mockDB.performanceTests.filter(t => 
        t.userId === userId && isWithinTimeframe(t.timestamp, timeframe)
    );
    
    const wellness = mockDB.wellness.filter(w => 
        w.userId === userId && isWithinTimeframe(w.date, timeframe)
    );

    const trends = {
        performance: calculatePerformanceTrends(performanceTests),
        body_composition: calculateBodyCompositionTrends(measurements),
        wellness: calculateWellnessTrends(wellness),
        correlations: calculateCorrelations(performanceTests, wellness),
        insights: generateInsights(performanceTests, wellness, measurements),
        recommendations: generateRecommendations(performanceTests, wellness, measurements)
    };

    return {
        statusCode: 200,
        body: JSON.stringify(trends)
    };
}

// Data Export Handler
async function handleExport(userId, query) {
    const format = query?.format || 'json';
    const timeframe = query?.timeframe || '12m';

    // Gather all user data
    const allData = {
        measurements: mockDB.measurements.filter(m => 
            m.userId === userId && isWithinTimeframe(m.timestamp, timeframe)
        ),
        performanceTests: mockDB.performanceTests.filter(t => 
            t.userId === userId && isWithinTimeframe(t.timestamp, timeframe)
        ),
        wellness: mockDB.wellness.filter(w => 
            w.userId === userId && isWithinTimeframe(w.date, timeframe)
        ),
        supplements: mockDB.supplements.filter(s => 
            s.userId === userId && isWithinTimeframe(s.date, timeframe)
        ),
        injuries: mockDB.injuries.filter(i => i.userId === userId),
        exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
        const csv = convertToCSV(allData);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="performance-data.csv"'
            },
            body: csv
        };
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allData)
    };
}

// Utility Functions
function parseAuthToken(authHeader) {
    // Mock authentication - return demo user ID
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return 'demo-user-123';
    }
    return null;
}

function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function isWithinTimeframe(date, timeframe) {
    const now = new Date();
    const targetDate = new Date(date);
    
    const timeframeMap = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '3m': 3 * 30 * 24 * 60 * 60 * 1000,
        '6m': 6 * 30 * 24 * 60 * 60 * 1000,
        '12m': 12 * 30 * 24 * 60 * 60 * 1000
    };
    
    const timeframeMs = timeframeMap[timeframe] || timeframeMap['12m'];
    return (now - targetDate) <= timeframeMs;
}

function validateMeasurementData(data) {
    const errors = [];
    
    if (data.height && (data.height < 140 || data.height > 220)) {
        errors.push('Height must be between 140-220 cm');
    }
    
    if (data.weight && (data.weight < 40 || data.weight > 200)) {
        errors.push('Weight must be between 40-200 kg');
    }
    
    if (data.bodyFat && (data.bodyFat < 3 || data.bodyFat > 50)) {
        errors.push('Body fat must be between 3-50%');
    }
    
    return errors;
}

function calculateMeasurementsSummary(measurements) {
    if (measurements.length === 0) return null;
    
    const latest = measurements[measurements.length - 1];
    const previous = measurements[measurements.length - 2];
    
    const changes = previous ? {
        weight: ((latest.weight - previous.weight) / previous.weight * 100).toFixed(1),
        bodyFat: ((latest.bodyFat - previous.bodyFat) / previous.bodyFat * 100).toFixed(1)
    } : null;
    
    return { latest, changes };
}

function calculatePerformanceTrends(tests) {
    const trends = {};
    const testTypes = [...new Set(tests.map(t => t.testType))];
    
    testTypes.forEach(type => {
        const typeTests = tests.filter(t => t.testType === type)
                              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (typeTests.length >= 2) {
            const latest = typeTests[typeTests.length - 1].result;
            const previous = typeTests[typeTests.length - 2].result;
            const change = ((latest - previous) / previous * 100).toFixed(1);
            
            trends[type] = {
                trend: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
                changePercent: change,
                data: typeTests.map(t => ({ date: t.timestamp, value: t.result }))
            };
        }
    });
    
    return trends;
}

function calculateWellnessAverages(wellness) {
    if (wellness.length === 0) return null;
    
    const metrics = ['sleep', 'energy', 'stress', 'soreness', 'motivation'];
    const averages = {};
    
    metrics.forEach(metric => {
        const values = wellness.map(w => w[metric]).filter(v => v != null);
        averages[metric] = values.length > 0 ? 
            (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1) : null;
    });
    
    return averages;
}

function convertToCSV(data) {
    let csv = 'Date,Type,Metric,Value,Notes\n';
    
    // Add measurements
    data.measurements.forEach(m => {
        csv += `${m.timestamp},Measurement,Height,${m.height},""\n`;
        csv += `${m.timestamp},Measurement,Weight,${m.weight},""\n`;
        csv += `${m.timestamp},Measurement,BodyFat,${m.bodyFat},""\n`;
    });
    
    // Add performance tests
    data.performanceTests.forEach(t => {
        csv += `${t.timestamp},Performance,${t.testType},${t.result},""\n`;
    });
    
    // Add wellness data
    data.wellness.forEach(w => {
        csv += `${w.date},Wellness,Sleep,${w.sleep},""\n`;
        csv += `${w.date},Wellness,Energy,${w.energy},""\n`;
        csv += `${w.date},Wellness,Stress,${w.stress},""\n`;
    });
    
    return csv;
}

// Additional analytics functions
function calculateCorrelations(performanceTests, wellness) {
    // Simplified correlation analysis
    return {
        sleep_performance: 0.65,
        stress_performance: -0.43,
        energy_performance: 0.72
    };
}

function generateInsights(performanceTests, wellness, measurements) {
    const insights = [];
    
    if (wellness.length > 5) {
        const avgSleep = wellness.reduce((sum, w) => sum + w.sleep, 0) / wellness.length;
        if (avgSleep < 6) {
            insights.push('Sleep quality below optimal range - may impact performance');
        }
    }
    
    if (performanceTests.length > 3) {
        const recent40Yard = performanceTests
            .filter(t => t.testType === '40YardDash')
            .slice(-3);
        
        if (recent40Yard.length >= 3) {
            const isImproving = recent40Yard.every((test, i) => 
                i === 0 || test.result < recent40Yard[i-1].result
            );
            
            if (isImproving) {
                insights.push('Consistent improvement in sprint speed detected');
            }
        }
    }
    
    return insights;
}

function generateRecommendations(performanceTests, wellness, measurements) {
    return [
        'Maintain current training intensity based on performance improvements',
        'Consider sleep optimization strategies for enhanced recovery',
        'Monitor stress levels and implement recovery protocols as needed'
    ];
}

function calculateTestsSummary(tests) {
    const byType = {};
    tests.forEach(test => {
        if (!byType[test.testType]) byType[test.testType] = [];
        byType[test.testType].push(test.result);
    });
    
    const summary = {};
    Object.keys(byType).forEach(type => {
        const results = byType[type];
        summary[type] = {
            count: results.length,
            best: Math.min(...results), // Assuming lower is better for most tests
            average: (results.reduce((sum, r) => sum + r, 0) / results.length).toFixed(2),
            latest: results[results.length - 1]
        };
    });
    
    return summary;
}