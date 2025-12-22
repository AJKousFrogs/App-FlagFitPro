# Lazy Loading Quick Reference

## 🚀 Quick Start

### Current Setup
- ✅ All routes use `loadComponent` for lazy loading
- ✅ Custom preloading strategy enabled
- ✅ Routes organized by feature
- ✅ Smart preloading based on auth status

## 📋 Route Configuration

### Basic Lazy Loading
```typescript
{
  path: "my-route",
  loadComponent: () => import("./my.component").then(m => m.MyComponent)
}
```

### With Guards
```typescript
{
  path: "protected",
  loadComponent: () => import("./protected.component").then(m => m.ProtectedComponent),
  canActivate: [authGuard]
}
```

### High Priority (Preload Immediately)
```typescript
{
  path: "dashboard",
  loadComponent: () => import("./dashboard.component").then(m => m.DashboardComponent),
  data: { preload: true, priority: 'high' }
}
```

### Disable Preloading
```typescript
{
  path: "heavy",
  loadComponent: () => import("./heavy.component").then(m => m.HeavyComponent),
  data: { preload: false }
}
```

## 🎯 Preloading Behavior

| Route Type | Preload Delay | Examples |
|------------|---------------|----------|
| High Priority | Immediate | dashboard, training, analytics |
| Standard Auth | 2 seconds | tournaments, community, profile |
| Public | 5 seconds | landing, login, register |
| Disabled | Never | game-tracker (heavy) |

## 📁 Route Organization

Routes are organized in `feature-routes.ts`:
- `publicRoutes` - No auth required
- `dashboardRoutes` - Dashboard (high priority)
- `trainingRoutes` - Training features
- `analyticsRoutes` - Analytics features
- `teamRoutes` - Team management
- `gameRoutes` - Games & tournaments
- `wellnessRoutes` - Wellness & health
- `socialRoutes` - Community & chat
- `profileRoutes` - User profile

## 🔧 Customization

### Add New Route
1. Add to appropriate feature group in `feature-routes.ts`
2. Set `data.preload` and `data.priority` as needed
3. Route automatically uses preloading strategy

### Change Preload Delay
Edit `auth-aware-preload.strategy.ts`:
```typescript
// Standard routes delay
return timer(2000).pipe(mergeMap(() => load()));

// Public routes delay
return timer(5000).pipe(mergeMap(() => load()));
```

## 📊 Monitoring

### Check Bundle Sizes
```bash
npm run build
# Check dist/ folder for chunk sizes
```

### Verify Preloading
1. Open DevTools → Network tab
2. Navigate to app
3. Watch for chunk files loading
4. High-priority routes load immediately
5. Other routes load after delays

## ✅ Best Practices

1. **Mark heavy components**: Use `data.preload = false`
2. **Prioritize critical routes**: Use `priority: 'high'`
3. **Group related routes**: Keep in same feature group
4. **Monitor bundle sizes**: Regularly check chunk sizes

## 📚 Full Documentation

See `LAZY_LOADING_UPGRADE.md` for complete details.

