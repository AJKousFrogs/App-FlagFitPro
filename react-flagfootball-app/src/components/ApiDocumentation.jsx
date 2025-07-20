/**
 * API Documentation Component
 * Displays interactive API documentation using Swagger UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import env from '../config/environment';
import logger from '../services/logger.service';

const ApiDocumentation = ({ className = '' }) => {
  const [apiSpec, setApiSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentServer, setCurrentServer] = useState(0);

  const config = env.getConfig();

  // Define API servers based on environment
  const servers = [
    {
      url: `${config.api.pocketbaseUrl  }/api`,
      description: 'PocketBase API (Current)'
    },
    {
      url: `${config.api.baseUrl  }/v1`,
      description: 'API Server v1'
    },
    {
      url: 'https://api.flagfitpro.com/v1',
      description: 'Production Server'
    }
  ];

  const loadApiSpec = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load the OpenAPI spec
      const response = await fetch('/docs/api-spec.yaml');
      if (!response.ok) {
        throw new Error(`Failed to load API spec: ${response.status}`);
      }

      const yamlText = await response.text();
      
      // Parse YAML to JSON (basic parsing for demo)
      const spec = await parseYamlToJson(yamlText);
      
      // Update servers in spec
      spec.servers = servers;
      
      setApiSpec(spec);
      logger.info('API documentation loaded successfully');
    } catch (err) {
      setError(err.message);
      logger.error('Failed to load API documentation', { error: err.message });
    } finally {
      setLoading(false);
    }
  }, [servers, parseYamlToJson]);

  useEffect(() => {
    loadApiSpec();
  }, [loadApiSpec]);

  // Basic YAML to JSON parser (for demo purposes)
  // In production, use a proper YAML parser like js-yaml
  const parseYamlToJson = async () => {
    // This is a simplified parser - in production use js-yaml
    try {
      // For now, return a basic spec structure
      return {
        openapi: '3.0.3',
        info: {
          title: 'FlagFit Pro API',
          description: 'Flag Football Training and Analytics Platform API',
          version: '1.0.0',
          contact: {
            name: 'FlagFit Pro API Support',
            email: 'api-support@flagfitpro.com'
          }
        },
        servers,
        paths: {
          '/auth/login': {
            post: {
              tags: ['Authentication'],
              summary: 'User login',
              description: 'Authenticate user and receive access token',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['email', 'password'],
                      properties: {
                        email: {
                          type: 'string',
                          format: 'email',
                          example: 'user@example.com'
                        },
                        password: {
                          type: 'string',
                          format: 'password',
                          example: 'password123'
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'Login successful',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          user: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              email: { type: 'string' },
                              first_name: { type: 'string' },
                              last_name: { type: 'string' },
                              role: { type: 'string', enum: ['player', 'coach', 'admin'] }
                            }
                          },
                          token: {
                            type: 'string',
                            description: 'JWT access token'
                          }
                        }
                      }
                    }
                  }
                },
                '401': {
                  description: 'Unauthorized - invalid credentials'
                }
              }
            }
          },
          '/training/sessions': {
            get: {
              tags: ['Training'],
              summary: 'Get training sessions',
              description: 'Retrieve user training sessions with optional filtering',
              parameters: [
                {
                  name: 'page',
                  in: 'query',
                  description: 'Page number for pagination',
                  schema: { type: 'integer', minimum: 1, default: 1 }
                },
                {
                  name: 'limit',
                  in: 'query',
                  description: 'Number of sessions per page',
                  schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                }
              ],
              responses: {
                '200': {
                  description: 'Training sessions retrieved successfully',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                title: { type: 'string' },
                                type: { type: 'string', enum: ['strength', 'agility', 'endurance', 'skills'] },
                                duration: { type: 'integer', description: 'Duration in minutes' },
                                date: { type: 'string', format: 'date-time' }
                              }
                            }
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              limit: { type: 'integer' },
                              total: { type: 'integer' },
                              pages: { type: 'integer' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            post: {
              tags: ['Training'],
              summary: 'Create training session',
              description: 'Create a new training session',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['title', 'type', 'date'],
                      properties: {
                        title: { type: 'string', minLength: 1 },
                        description: { type: 'string' },
                        type: { type: 'string', enum: ['strength', 'agility', 'endurance', 'skills'] },
                        date: { type: 'string', format: 'date-time' },
                        exercises: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              sets: { type: 'integer' },
                              reps: { type: 'integer' },
                              duration: { type: 'integer' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                '201': {
                  description: 'Training session created successfully'
                }
              }
            }
          },
          '/analytics/stats': {
            get: {
              tags: ['Analytics'],
              summary: 'Get training statistics',
              description: 'Retrieve user training statistics and performance metrics',
              parameters: [
                {
                  name: 'timeframe',
                  in: 'query',
                  description: 'Time period for statistics',
                  schema: { type: 'string', enum: ['7d', '30d', '90d', '1y', 'all'], default: '30d' }
                }
              ],
              responses: {
                '200': {
                  description: 'Training statistics retrieved successfully',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          total_sessions: { type: 'integer' },
                          total_duration: { type: 'integer', description: 'Total duration in minutes' },
                          avg_session_duration: { type: 'number' },
                          performance_trend: { type: 'number' },
                          streak_days: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '/health': {
            get: {
              tags: ['System'],
              summary: 'Health check',
              description: 'Check API health status',
              responses: {
                '200': {
                  description: 'API is healthy',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                          timestamp: { type: 'string', format: 'date-time' },
                          version: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          securitySchemes: {
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        },
        security: [
          { BearerAuth: [] }
        ]
      };
    } catch (err) {
      throw new Error('Failed to parse API specification');
    }
  };

  const handleServerChange = (serverIndex) => {
    setCurrentServer(serverIndex);
    if (apiSpec) {
      const updatedSpec = {
        ...apiSpec,
        servers: [servers[serverIndex]]
      };
      setApiSpec(updatedSpec);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800">Failed to Load API Documentation</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadApiSpec}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">API Documentation</h2>
            <p className="text-gray-600 mt-1">Interactive API reference for FlagFit Pro</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="server-select" className="text-sm font-medium text-gray-700">
                Server:
              </label>
              <select
                id="server-select"
                value={currentServer}
                onChange={(e) => handleServerChange(parseInt(e.target.value))}
                className="block px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {servers.map((server, index) => (
                  <option key={index} value={index}>
                    {server.description}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={loadApiSpec}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="api-documentation">
        {apiSpec && (
          <SwaggerUI
            spec={apiSpec}
            docExpansion="list"
            defaultModelsExpandDepth={2}
            defaultModelExpandDepth={2}
            displayOperationId={false}
            displayRequestDuration={true}
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
            requestInterceptor={(request) => {
              // Add authentication header if available
              const token = localStorage.getItem('auth_token');
              if (token) {
                request.headers.Authorization = `Bearer ${token}`;
              }
              
              // Add API version header
              request.headers['API-Version'] = 'v1';
              
              // Add CSRF token
              const csrfToken = sessionStorage.getItem('csrf_token');
              if (csrfToken) {
                request.headers['X-CSRF-Token'] = csrfToken;
              }
              
              logger.info('API request intercepted', {
                method: request.method,
                url: request.url
              });
              
              return request;
            }}
            responseInterceptor={(response) => {
              logger.info('API response intercepted', {
                status: response.status,
                url: response.url
              });
              
              return response;
            }}
            onComplete={() => {
              logger.info('Swagger UI loaded successfully');
            }}
            plugins={[
              {
                statePlugins: {
                  spec: {
                    wrapSelectors: {
                      allowTryItOutFor: () => () => true
                    }
                  }
                }
              }
            ]}
          />
        )}
      </div>

      {/* Additional Information */}
      <div className="border-t border-gray-200 p-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Getting Started</h4>
            <p className="text-sm text-gray-600 mb-2">
              To use the API, you&apos;ll need to authenticate using the login endpoint.
            </p>
            <a
              href="#/Authentication/post_auth_login"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View Authentication →
            </a>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Rate Limits</h4>
            <p className="text-sm text-gray-600 mb-2">
              API requests are limited to 60 requests per minute per user.
            </p>
            <span className="text-sm text-gray-500">Monitor your usage in response headers</span>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Support</h4>
            <p className="text-sm text-gray-600 mb-2">
              Need help? Contact our API support team.
            </p>
            <a
              href="mailto:api-support@flagfitpro.com"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              api-support@flagfitpro.com
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .api-documentation {
          min-height: 600px;
        }
        
        /* Custom Swagger UI styles */
        .api-documentation .swagger-ui .info {
          margin: 20px 0;
        }
        
        .api-documentation .swagger-ui .scheme-container {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          margin: 20px 0;
        }
        
        .api-documentation .swagger-ui .opblock.opblock-post {
          border-color: #49cc90;
          background: rgba(73, 204, 144, 0.1);
        }
        
        .api-documentation .swagger-ui .opblock.opblock-get {
          border-color: #61affe;
          background: rgba(97, 175, 254, 0.1);
        }
        
        .api-documentation .swagger-ui .opblock.opblock-put {
          border-color: #fca130;
          background: rgba(252, 161, 48, 0.1);
        }
        
        .api-documentation .swagger-ui .opblock.opblock-delete {
          border-color: #f93e3e;
          background: rgba(249, 62, 62, 0.1);
        }
      `}</style>
    </div>
  );
};

export default ApiDocumentation;