/**
 * PM2 Ecosystem Configuration
 * Manages application processes for production deployment
 */

module.exports = {
  apps: [
    {
      // Frontend Application
      name: 'flagfit-frontend',
      script: 'npm',
      args: 'run preview',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Monitoring
      monitoring: true,
      pmx: true,
      
      // Logging
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Memory management
      max_memory_restart: '512M',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Process management
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      
      // Advanced features
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      
      // Watch files in development
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        '*.log'
      ]
    },
    
    {
      // Health Check Service
      name: 'flagfit-health-check',
      script: './scripts/health-check.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 */6 * * *', // Restart every 6 hours
      
      env: {
        NODE_ENV: 'production',
        HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
        HEALTH_CHECK_TIMEOUT: 5000,   // 5 seconds
        ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL || ''
      },
      
      // Logging
      log_file: './logs/health-check.log',
      out_file: './logs/health-check-out.log',
      error_file: './logs/health-check-error.log',
      
      // Auto restart
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 2000
    },
    
    {
      // Log Rotation Service
      name: 'flagfit-log-rotation',
      script: './scripts/log-rotation.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 0 * * *', // Daily restart
      
      env: {
        LOG_RETENTION_DAYS: 30,
        LOG_MAX_SIZE: '100M',
        COMPRESSION_ENABLED: true
      },
      
      // Logging
      log_file: './logs/log-rotation.log',
      out_file: './logs/log-rotation-out.log',
      error_file: './logs/log-rotation-error.log',
      
      autorestart: true,
      max_restarts: 3
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/flagfit-pro.git',
      path: '/var/www/flagfit-pro',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/flagfit-pro.git',
      path: '/var/www/flagfit-pro-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};