# 🚀 Flag Football Training App - Algorithm API Documentation

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready

---

## Overview

The Algorithm API provides access to sophisticated, evidence-based training algorithms including personalized training recommendations, supplement protocols, recovery optimization, performance predictions, and LA28 Olympic qualification tracking.

### Key Features

- **Comprehensive Recommendations**: Multi-algorithm integration with synergy optimization
- **Evidence-Based**: 120+ peer-reviewed studies integrated
- **Real-time Analytics**: Performance predictions and injury risk assessment
- **LA28 Olympics Ready**: Qualification tracking and roadmap generation
- **Rate Limited**: Protected endpoints with caching for performance

## Base URL

```
http://localhost:3001/api/algorithms
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limits

- **Comprehensive Recommendations**: 5 requests per 5 minutes
- **Individual Algorithm Endpoints**: 10 requests per 5 minutes
- **Dashboard Data**: 3 requests per 5 minutes
- **LA28 Qualification**: 5 requests per 5 minutes

## Caching

- Most endpoints are cached for 5-10 minutes
- Expensive operations (comprehensive, dashboard) cached for 10 minutes
- Use `DELETE /api/algorithms/cache/:userId` to clear user cache

---

## 📊 **Comprehensive Algorithm Integration**

### Get Comprehensive Recommendations

**GET** `/comprehensive/:userId`

The master endpoint that combines all algorithms with synergy optimization.

#### Parameters

| Parameter     | Type   | Description                             |
| ------------- | ------ | --------------------------------------- |
| `userId`      | string | User ID (path parameter)                |
| `goals`       | string | Comma-separated goals (query parameter) |
| `timeHorizon` | number | Days for prediction (default: 365)      |

#### Example Request

```bash
GET /api/algorithms/comprehensive/user123?goals=strength,speed,endurance&timeHorizon=180
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "generatedAt": "2025-01-07T10:00:00.000Z",
    "timeHorizon": 180,
    "goals": ["strength", "speed", "endurance"],
    "integratedRecommendations": {
      "training": {...},
      "supplements": {...},
      "recovery": {...},
      "synergies": [...]
    },
    "actionPlan": {
      "immediate": {...},
      "shortTerm": {...},
      "mediumTerm": {...},
      "longTerm": {...}
    },
    "successProbability": {
      "overallProbability": 87,
      "factors": {...}
    }
  },
  "executionTime": 1234
}
```

---

## 🏋️ **Evidence-Based Training Recommendations**

### Get Training Recommendations

**GET** `/training/recommendations/:userId`

Personalized training recommendations based on 120+ peer-reviewed studies.

#### Example Request

```bash
GET /api/algorithms/training/recommendations/user123
```

#### Response Structure

```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "recommendations": {
      "strength": {...},
      "endurance": {...},
      "power": {...},
      "recovery": {...}
    },
    "evidenceBasis": [...],
    "confidenceScore": 0.89,
    "implementationPlan": {...}
  }
}
```

---

## 💊 **Supplement Recommendations**

### Get Supplement Recommendations

**GET** `/supplements/recommendations/:userId`

Evidence-based supplement protocols with timing, dosage, and genetic considerations.

#### Parameters

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| `goals`   | string | Comma-separated goals |

#### Example Request

```bash
GET /api/algorithms/supplements/recommendations/user123?goals=strength,recovery
```

#### Response Structure

```json
{
  "data": {
    "supplementStack": [
      {
        "name": "Creatine Monohydrate",
        "key": "CREATINE",
        "dosage": "5g/day",
        "timing": "Post-workout",
        "evidenceLevel": "Very High",
        "effectSize": 0.67,
        "personalizedProtocol": {...}
      }
    ],
    "timing": {...},
    "interactions": [...],
    "safetyConsiderations": [...]
  }
}
```

---

## 🛌 **Recovery Optimization**

### Get Recovery Optimization Plan

**GET** `/recovery/optimization/:userId`

Comprehensive recovery protocols including heat therapy, compression, and sleep optimization.

#### Parameters

| Parameter   | Type   | Description                 |
| ----------- | ------ | --------------------------- |
| `intensity` | number | Training intensity (0-1)    |
| `duration`  | number | Training duration (minutes) |

#### Example Request

```bash
GET /api/algorithms/recovery/optimization/user123?intensity=0.8&duration=90
```

#### Response Structure

```json
{
  "data": {
    "optimizedPlan": {
      "sleep": {
        "duration": "8.2 hours",
        "timing": {...},
        "protocol": {...}
      },
      "heatTherapy": {
        "method": "sauna",
        "temperature": "60°C",
        "duration": "20 minutes",
        "frequency": "3-4x/week"
      },
      "compression": {...}
    },
    "expectedOutcomes": {...}
  }
}
```

---

## 📈 **Performance Predictions**

### Get Performance Predictions

**GET** `/performance/predictions/:userId`

Mathematical performance modeling with genetic factors and timeline predictions.

#### Parameters

| Parameter    | Type   | Description              |
| ------------ | ------ | ------------------------ |
| `targetDate` | string | Target date (ISO format) |

#### Example Request

```bash
GET /api/algorithms/performance/predictions/user123?targetDate=2025-07-01
```

#### Response Structure

```json
{
  "data": {
    "individualPredictions": {
      "speed": {
        "currentValue": 12.5,
        "predictedValue": 11.8,
        "improvement": -0.7,
        "improvementPercentage": -5.6,
        "confidence": 0.87
      }
    },
    "integratedPrediction": {...},
    "confidenceIntervals": {...}
  }
}
```

---

## 🥇 **LA28 Olympic Qualification**

### Get LA28 Qualification Roadmap

**GET** `/la28/qualification/:userId`

Comprehensive roadmap for LA28 Olympic qualification with milestone tracking.

#### Parameters

| Parameter     | Type   | Description                        |
| ------------- | ------ | ---------------------------------- |
| `targetLevel` | string | 'NATIONAL_TEAM' or 'REGIONAL_TEAM' |

#### Example Request

```bash
GET /api/algorithms/la28/qualification/user123?targetLevel=NATIONAL_TEAM
```

#### Response Structure

```json
{
  "data": {
    "qualificationGaps": {
      "40_yard_dash": {
        "currentValue": 4.8,
        "targetValue": 4.4,
        "gap": 0.4,
        "status": "significant_gap"
      }
    },
    "roadmap": {
      "phases": {...}
    },
    "qualificationProbability": {
      "overallProbability": 78
    },
    "milestones": [...]
  }
}
```

---

## 🎯 **Dashboard Data**

### Get Complete Dashboard Data

**GET** `/dashboard/:userId`

**⚠️ EXPENSIVE OPERATION** - Executes all algorithms in parallel. Use sparingly.

#### Parameters

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| `goals`   | string | Comma-separated goals |

#### Example Request

```bash
GET /api/algorithms/dashboard/user123?goals=strength,speed
```

#### Response Structure

```json
{
  "data": {
    "comprehensive": {...},
    "training": {...},
    "supplements": {...},
    "recovery": {...},
    "performance": {...},
    "la28": {...},
    "timestamp": "2025-01-07T10:00:00.000Z",
    "executionTime": 3456
  }
}
```

---

## 🧹 **Cache Management**

### Clear User Cache

**DELETE** `/cache/:userId`

Clear cached algorithm results for a user.

#### Parameters

| Parameter       | Type   | Description                       |
| --------------- | ------ | --------------------------------- |
| `algorithmType` | string | Optional: specific algorithm type |

#### Example Request

```bash
DELETE /api/algorithms/cache/user123?algorithmType=comprehensive
```

---

## ❤️ **Health Check**

### API Health Check

**GET** `/health`

Check if all algorithm services are running.

#### Response

```json
{
  "success": true,
  "message": "Algorithm API is healthy",
  "services": {
    "algorithmIntegration": "active",
    "evidenceEngine": "active",
    "supplementEngine": "active",
    "recoveryEngine": "active",
    "performanceEngine": "active",
    "qualificationTracker": "active"
  }
}
```

---

## 🚨 **Error Responses**

### Standard Error Format

```json
{
  "success": false,
  "error": "Error description",
  "details": "Detailed error message"
}
```

### Common Error Codes

| Code  | Description                               |
| ----- | ----------------------------------------- |
| `400` | Bad Request - Invalid parameters          |
| `401` | Unauthorized - Missing/invalid token      |
| `403` | Forbidden - Token expired                 |
| `429` | Too Many Requests - Rate limit exceeded   |
| `500` | Internal Server Error - Algorithm failure |

---

## 📱 **Frontend Integration**

### Using with Angular Service

```typescript
// Angular 21: Service-based integration
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendIntegrationService {
  private http = inject(HttpClient);
  
  // Signals for reactive state
  loading = signal(false);
  error = signal<string | null>(null);
  
  getDashboardData(userId: string, metrics: string[]): Observable<any> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.http.get('/api/dashboard', {
      params: { userId, metrics: metrics.join(',') }
    }).pipe(
      finalize(() => this.loading.set(false)),
      catchError(err => {
        this.error.set(err.message);
        throw err;
      })
    );
  }
}

// Component usage
@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `...`
})
export class DashboardComponent {
  private backendService = inject(BackendIntegrationService);
  
  // Use signals for reactive state
  dashboardData = signal<any>(null);
  
  ngOnInit() {
    this.backendService.getDashboardData("user123", ["strength", "speed"])
      .subscribe(data => this.dashboardData.set(data));
  }
}
```

### Direct API Calls

```javascript
// Get comprehensive recommendations
const response = await fetch(
  "/api/algorithms/comprehensive/user123?goals=strength,speed",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

const data = await response.json();
```

---

## 🔧 **Advanced Configuration**

### Environment Variables

```bash
# Database
DATABASE_URL=your_postgres_connection_string

# JWT
JWT_SECRET=your_secret_key

# API Configuration
ALGORITHM_CACHE_TTL=600000  # 10 minutes
ALGORITHM_RATE_LIMIT=10     # Requests per window
```

### Database Tables

The API automatically creates and manages these tables:

- `algorithm_execution_results`
- `supplement_recommendations`
- `recovery_optimization_plans`
- `performance_predictions`
- `la28_qualification_tracking`
- `algorithm_synergy_tracking`
- `algorithm_cache`

---

## 🧪 **Testing**

### Example Test Requests

```bash
# Health check
curl http://localhost:3001/api/algorithms/health

# Get comprehensive recommendations (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/algorithms/comprehensive/user123?goals=strength
```

### Performance Benchmarks

- **Comprehensive Algorithm**: ~2-4 seconds
- **Individual Algorithms**: ~500ms-1.5s
- **Cached Responses**: ~50-100ms
- **Dashboard Data**: ~3-6 seconds

---

## 🎯 **Best Practices**

1. **Always authenticate** - All endpoints require valid JWT tokens
2. **Use caching** - Cache is automatic, but respect rate limits
3. **Handle errors** - Always check `success` field in responses
4. **Batch requests** - Use dashboard endpoint for multiple algorithms
5. **Monitor performance** - Check `executionTime` in responses
6. **Clear cache when needed** - Use cache management endpoints for fresh data

---

## 🔗 **Related Documentation**

- [AdvancedPredictionEngine API](ADVANCED_PREDICTION_ENGINE_API.md) - Performance prediction engine
- [DataScienceModels API](DATA_SCIENCE_MODELS_API.md) - Analytics engine
- [DatabaseConnectionManager API](DATABASE_CONNECTION_MANAGER_API.md) - Database connections
- [Architecture](ARCHITECTURE.md) - System architecture overview
- [Backend Setup](BACKEND_SETUP.md) - Backend setup guide

## 📞 **Support**

For algorithm API issues or questions:

- Check the health endpoint first
- Review error messages and details
- Monitor rate limits and cache usage
- Ensure database tables are properly migrated

## 📝 **Changelog**

- **v1.0 (2025-01-07)**: Initial release with comprehensive algorithm integration
- Rate limiting and caching implemented
- LA28 qualification tracking added
- Dashboard endpoint created
