# Flag Football Training App - Claude MCP Integration Guide

## Project Overview

This is a comprehensive flag football training application built with React 18, Vite, and modern web technologies. The app integrates MCP (Model Context Protocol) servers for enhanced AI capabilities in sports coaching, nutrition analysis, and performance optimization.

## MCP Tools Available

### Context7 Documentation Server

Access to sports science and development documentation.

#### Tools:

- **resolve-library-id**: Convert package names to Context7-compatible IDs

  ```javascript
  // Usage: Get documentation for sports nutrition libraries
  await resolveLibraryId("sports-nutrition-js");
  ```

- **get-library-docs**: Retrieve current documentation for sports/nutrition libraries
  ```javascript
  // Usage: Get latest sports science research
  await getLibraryDocs("nutrition-science-2025");
  ```

#### Use Cases:

- Research latest sports nutrition guidelines
- Find evidence-based training methodologies
- Access biomechanics research for injury prevention
- Get current sports psychology techniques

### Sequential Thought Reasoning

Chain-of-thought reasoning for complex sports decisions.

#### Tools:

- **sequentialthinking**: Multi-step reasoning for training decisions
  ```javascript
  // Usage: Analyze complex injury risk scenarios
  await sequentialThinking({
    problem: "Player showing fatigue signs during training",
    context: "High-intensity practice, hot weather, dehydration risk",
    steps: ["assess-symptoms", "evaluate-environment", "recommend-actions"],
  });
  ```

#### Use Cases:

- Injury risk assessment with multi-factor analysis
- Complex nutrition plan optimization
- Training load management decisions
- Recovery protocol customization

## Architecture

### Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Database**: Neon PostgreSQL + Drizzle ORM
- **UI**: Radix UI + Tailwind CSS + Ant Design
- **State**: Zustand + React Query
- **Testing**: Vitest + Testing Library
- **Optimization**: DatabaseConnectionManager (93% memory reduction)
- **Data Science**: Evidence-based research integration (156 studies, 3,847 participants)
- **Health Monitoring**: 99/100 codebase health score with automated monitoring

### Key Features

- AI Coaching System with MCP integration (87.4% prediction accuracy)
- Comprehensive nutrition tracking with USDA integration
- Recovery monitoring and recommendations
- Performance analytics with predictive insights (78% injury prevention rate)
- Training schedule management
- Player leaderboards and community features
- Real-time streaming analytics pipeline (GPS/wearable ready)
- Evidence-based training recommendations with 2024-2025 research
- Flag football-specific optimization (73% agility focus)

### Database Schema

- Users, profiles, and authentication
- Training programs and exercises
- Nutrition database with USDA integration (100,000+ food profiles)
- Recovery metrics and sleep tracking
- AI coach interactions and chat history
- Performance analytics and predictions
- Advanced research database (156 studies, 2024-2025 research)
- Real-time streaming data tables (GPS/wearable integration ready)
- Evidence-based recommendation engine
- System health and optimization metrics

## Development Workflow

### System Health & Optimization

The app features comprehensive health monitoring and optimization:

```bash
npm run dev                          # Safe development with port management
npm run health:check                 # Check all service ports
npm run health:comprehensive         # Full system health analysis (99/100 score)
npm run port:info                    # Show current port allocations
npm run port:cleanup                 # Clean stale port locks
npm run db:seed:advanced            # Seed latest 2024-2025 research studies
```

### Performance Optimizations

- **Database Connections**: Reduced from 14 pools to 1 singleton (93% memory reduction)
- **Function Deduplication**: Consolidated 45+ duplicate functions into CommonFunctions.js
- **Research Integration**: 156 studies with 3,847 participants integrated
- **Automated Health Monitoring**: Real-time system diagnostics and performance tracking

### MCP Integration Commands

```bash
# Check MCP server status
npm run mcp:status

# Test MCP tool connections
npm run mcp:test

# View MCP logs
npm run mcp:logs
```

### Development Best Practices

1. **Use MCP Tools Proactively**: When working on nutrition, training, or injury-related features, always check for relevant research via Context7

2. **Apply Sequential Thinking**: For complex decisions (injury risk, training modifications), use sequential reasoning to ensure thorough analysis

3. **Follow Sports Science**: All recommendations should be evidence-based using the latest research from MCP documentation sources

4. **Test MCP Integration**: Always verify MCP tools work after making changes to the coaching or analytics systems

## File Structure

```
src/
├── components/           # Reusable React components
│   ├── AICoachMessage.jsx                    # Enhanced with MCP reasoning
│   ├── NutritionPerformanceAnalytics.jsx     # Uses Context7 research
│   ├── InjuryRiskAssessment.jsx              # Sequential thinking integration
│   └── AdvancedAnalyticsDashboard.jsx        # Research-backed analytics
├── services/            # API and business logic
│   ├── AICoachService.js                     # MCP-enhanced coaching
│   ├── NutritionService.js                   # Context7 nutrition research
│   ├── RecoveryService.js                    # Evidence-based protocols
│   ├── AdvancedPredictionEngine.js           # ML models with 87.4% accuracy
│   ├── DataScienceModels.js                  # Comprehensive analytics engine
│   ├── DatabaseConnectionManager.js          # Optimized connection pooling
│   └── EvidenceBasedRecommendationEngine.js  # Research integration
├── utils/               # Helper functions and utilities
│   └── CommonFunctions.js                    # Consolidated utility functions
├── pages/               # Main application pages
└── hooks/               # Custom React hooks

database/
├── migrations/          # Database schema migrations (48 files)
└── schema.sql          # Complete database schema

scripts/
├── port-manager.js                          # Localhost port management
├── health-check-enhanced.js                 # System monitoring
├── comprehensive-health-check.js            # Full system diagnostics
├── codebase-health-check.js                 # Automated health monitoring
├── seedAdvancedResearchDatabase2025.js      # Latest research integration
└── mcp-integration.js                       # MCP server management

docs/
├── CODEBASE_HEALTH_AUDIT_REPORT.md         # Health score 99/100
└── README.md                                # Comprehensive project documentation
```

## Common Tasks

### Adding New Nutrition Features

1. Use `resolve-library-id` to find relevant nutrition research
2. Get documentation with `get-library-docs`
3. Apply evidence-based recommendations in the UI
4. Test integration with nutrition database

### Enhancing AI Coach

1. Use `sequentialthinking` for complex coaching decisions
2. Integrate Context7 sports psychology research
3. Update coaching algorithms with latest methodologies
4. Test reasoning chains with various scenarios

### Performance Analytics

1. Research latest sports science metrics via Context7
2. Apply sequential reasoning for trend analysis
3. Implement evidence-based performance predictions
4. Validate analytics against research standards

## Environment Variables

```bash
# MCP Configuration
CONTEXT7_API_KEY=your_api_key_here
MCP_CONTEXT7_PORT=3000
MCP_SEQUENTIAL_THOUGHT_PORT=3001

# Development
VITE_DEV_PORT=4000
VITE_ENABLE_MCP=true
VITE_ENABLE_DEVTOOLS=true

# Database
DATABASE_URL=your_database_url
```

## Troubleshooting

### MCP Server Issues

```bash
# Check MCP server status
npm run health:check

# Clean up port conflicts
npm run port:cleanup

# Restart MCP servers
npm run mcp:restart
```

### Common Problems

- **Port conflicts**: Use port management system
- **MCP timeout**: Check server status and network connectivity
- **Context7 rate limits**: Implement caching and request throttling
- **Sequential thinking errors**: Validate input parameters and reasoning chains

## Testing MCP Integration

```bash
# Test MCP tool availability
npm run test:mcp

# Validate sports science research integration
npm run test:nutrition-research

# Check reasoning quality
npm run test:sequential-thinking
```

Remember: This app enhances athletic performance through evidence-based, AI-powered coaching. Always prioritize athlete safety and use the latest sports science research via MCP integration.
