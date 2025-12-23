# Testing Guide - Advanced UX/UI Components

## Overview

This guide covers testing procedures for the newly integrated advanced UX/UI components and their backend APIs.

## Prerequisites

1. **Development Environment:**
   - Node.js 18+ installed
   - Angular CLI installed
   - Netlify CLI installed (optional)

2. **Test Accounts:**
   - Valid user account with JWT token
   - Test database with sample data

3. **API Access:**
   - Base URL: `http://localhost:8888/.netlify/functions` (local)
   - Base URL: `https://your-site.netlify.app/api` (production)

## Backend API Testing

### 1. Performance Metrics API

#### Test: Get Performance Metrics

```bash
curl -X GET "http://localhost:8888/.netlify/functions/performance-metrics?athleteId=test-user-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": "speed",
        "label": "Top Speed",
        "value": 18.5,
        "unit": "mph",
        "trend": "up",
        "trendValue": 2.1,
        "target": 20,
        "color": "#10c96b",
        "icon": "pi pi-bolt"
      }
    ]
  }
}
```

**Test Cases:**

- [ ] Valid token returns metrics
- [ ] Invalid token returns 401
- [ ] Missing token returns 401
- [ ] Metrics include speed, accuracy, endurance
- [ ] Trends are calculated correctly
- [ ] Falls back to default metrics if no data

#### Test: Error Handling

```bash
# Test without token
curl -X GET "http://localhost:8888/.netlify/functions/performance-metrics"

# Test with invalid token
curl -X GET "http://localhost:8888/.netlify/functions/performance-metrics" \
  -H "Authorization: Bearer invalid-token"
```

### 2. Training Sessions API

#### Test: Create Training Session

```bash
curl -X POST "http://localhost:8888/.netlify/functions/training-sessions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exercises": [
      {
        "id": "sprint-1",
        "name": "40-Yard Sprints",
        "duration": 15,
        "intensity": "high",
        "category": "speed"
      }
    ],
    "duration": 60,
    "intensity": "medium",
    "goals": ["speed", "agility"],
    "equipment": ["cones"],
    "scheduledDate": "2024-01-20",
    "notes": "Test session"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "id": "session-uuid",
  "data": {
    "id": "session-uuid",
    "user_id": "user-id",
    "session_date": "2024-01-20",
    "session_type": "speed",
    "duration_minutes": 60,
    "intensity_level": 6,
    "status": "planned",
    "exercises": [...],
    "equipment": ["cones"],
    "goals": ["speed", "agility"]
  }
}
```

**Test Cases:**

- [ ] Valid session data creates session
- [ ] Missing exercises returns 400
- [ ] Session stored in database
- [ ] Equipment and goals saved correctly
- [ ] Status defaults to "planned"

#### Test: Get Training Sessions

```bash
curl -X GET "http://localhost:8888/.netlify/functions/training-sessions?status=planned&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Test Cases:**

- [ ] Returns user's sessions only
- [ ] Filters by status correctly
- [ ] Respects limit parameter
- [ ] Orders by date descending

### 3. Performance Heatmap API

#### Test: Get Heatmap Data

```bash
curl -X GET "http://localhost:8888/.netlify/functions/performance-heatmap?timeRange=6months" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "cells": [
      {
        "date": "2024-01-15",
        "value": 75,
        "intensity": 7,
        "sessions": 2,
        "duration": 90
      }
    ],
    "timeRange": "6months"
  }
}
```

**Test Cases:**

- [ ] Returns cells for date range
- [ ] Supports 3months, 6months, 1year ranges
- [ ] Calculates intensity correctly
- [ ] Aggregates multiple sessions per day
- [ ] Returns empty cells for days without training
- [ ] Falls back to mock data if no sessions

## Frontend Component Testing

### 1. Performance Dashboard Component

#### Manual Testing:

1. Navigate to Dashboard page
2. Verify Performance Dashboard component renders
3. Check that metrics display correctly
4. Verify real-time updates (if enabled)
5. Test responsive layout on mobile

#### Test Cases:

- [ ] Component loads without errors
- [ ] Metrics display with correct values
- [ ] Trend indicators show correctly
- [ ] Progress bars render properly
- [ ] Radar chart displays
- [ ] Real-time updates work (if enabled)
- [ ] Mobile responsive layout

#### Browser Console Checks:

```javascript
// Check component is loaded
document.querySelector("app-performance-dashboard");

// Check for errors
// Open DevTools → Console
```

### 2. Training Builder Component

#### Manual Testing:

1. Navigate to Training page
2. Find Training Builder component
3. Test wizard flow:
   - Step 1: Select goals
   - Step 2: Set parameters
   - Step 3: Review generated session
4. Test form validation
5. Test session generation

#### Test Cases:

- [ ] Component loads correctly
- [ ] Step 1: Can select multiple goals
- [ ] Step 1: Cannot proceed without selecting goals
- [ ] Step 2: Duration slider works
- [ ] Step 2: Intensity dropdown works
- [ ] Step 2: Equipment chips work
- [ ] Step 2: Weather data displays (if available)
- [ ] Step 3: Session generates correctly
- [ ] Step 3: Timeline displays exercises
- [ ] Can navigate between steps
- [ ] Can start session
- [ ] Can save session

#### Form Validation Tests:

- [ ] Duration must be between 15-120 minutes
- [ ] Intensity is required
- [ ] Cannot generate without goals

### 3. Swipe Table Component

#### Manual Testing:

1. Create a page with SwipeTableComponent
2. Test swipe gestures on mobile device
3. Test edit/delete actions
4. Test desktop view (actions always visible)

#### Test Cases:

- [ ] Table renders with data
- [ ] Swipe left reveals actions (mobile)
- [ ] Swipe right works (if implemented)
- [ ] Edit action triggers callback
- [ ] Delete action triggers callback
- [ ] Desktop shows actions always visible
- [ ] Responsive breakpoints work

### 4. Training Heatmap Component

#### Manual Testing:

1. Navigate to page with heatmap
2. Test time range selection
3. Test intensity/volume toggle
4. Click cells to view details
5. Test keyboard navigation

#### Test Cases:

- [ ] Heatmap grid renders
- [ ] Cells display correct colors
- [ ] Time range dropdown works
- [ ] Toggle switches between intensity/volume
- [ ] Click cell opens detail modal
- [ ] Modal displays correct data
- [ ] Keyboard navigation works
- [ ] Legend displays correctly
- [ ] Responsive on mobile

## Integration Testing

### End-to-End Flow: Create Training Session

1. **User logs in** → Dashboard loads
2. **Navigate to Training** → Training Builder visible
3. **Select goals** → Speed, Agility
4. **Set parameters** → 60 min, Medium intensity
5. **Generate session** → Exercises created
6. **Start session** → Session status updates
7. **Complete session** → Performance metrics update
8. **View heatmap** → New session appears

**Test Checklist:**

- [ ] All steps complete without errors
- [ ] Data persists in database
- [ ] UI updates reflect changes
- [ ] Performance metrics recalculate
- [ ] Heatmap updates with new data

## Performance Testing

### API Response Times

Test each endpoint and verify:

- [ ] Performance Metrics: < 500ms
- [ ] Training Sessions (GET): < 300ms
- [ ] Training Sessions (POST): < 1000ms
- [ ] Performance Heatmap: < 800ms

### Frontend Performance

- [ ] Components load < 2s
- [ ] No console errors
- [ ] Smooth animations
- [ ] No memory leaks
- [ ] Efficient re-renders

## Error Scenario Testing

### Backend Errors:

- [ ] Database connection failure → Graceful fallback
- [ ] Invalid JWT token → 401 error
- [ ] Missing required fields → 400 error
- [ ] Table doesn't exist → Mock data fallback

### Frontend Errors:

- [ ] API timeout → Error message displayed
- [ ] Network error → Retry mechanism
- [ ] Invalid data → Validation errors
- [ ] Component fails → Fallback UI

## Browser Compatibility

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

## Automated Testing (Future)

Consider adding:

- Unit tests for components
- Integration tests for APIs
- E2E tests with Playwright
- Performance benchmarks

## Test Data Setup

### Create Test Sessions:

```sql
INSERT INTO training_sessions (
  user_id, session_date, session_type,
  duration_minutes, intensity_level, status
) VALUES (
  'test-user-id', '2024-01-15', 'speed',
  45, 7, 'completed'
);
```

### Create Test Performance Tests:

```sql
INSERT INTO athlete_performance_tests (
  user_id, test_type, test_date, best_result
) VALUES (
  'test-user-id', '40YardDash', '2024-01-10', 4.8
);
```

## Reporting Issues

When reporting issues, include:

1. Test case that failed
2. Expected vs actual behavior
3. Browser/device information
4. Console errors (if any)
5. Network request/response (if API issue)
6. Steps to reproduce

---

**Last Updated:** 2024-01-XX  
**Testing Status:** Ready for QA
