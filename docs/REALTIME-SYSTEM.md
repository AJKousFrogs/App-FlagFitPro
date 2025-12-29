# Real-Time System Documentation

## 🔴 Live Data Updates

Your FlagFit Pro app now has **real-time data synchronization** across all devices and users!

## ✨ What This Means

- **Instant Updates**: Changes appear immediately without refreshing
- **Multi-Device Sync**: Update on phone → see on tablet instantly
- **Team Collaboration**: Multiple coaches/athletes see same data live
- **Live Game Tracking**: Real-time play-by-play updates
- **Auto-Refresh**: No manual refresh buttons needed

## 📡 What Has Real-Time Updates

### 1. **Training Sessions**

- New session added → appears instantly
- Session completed → status updates live
- Workload changes → dashboard refreshes

### 2. **Games/Matches**

- Live game tracking → plays update in real-time
- Stats changes → team sees updates immediately
- Score updates → everyone synced

### 3. **Wellness Data**

- Sleep logs → readiness recalculates
- Mood/fatigue → wellness index updates
- Recovery metrics → team dashboard refreshes

### 4. **Performance Metrics**

- Sprint times → trends update
- Jump heights → performance graphs refresh
- Skills assessments → progress tracks live

### 5. **Readiness/ACWR**

- Training load → ACWR recalculates
- Wellness → readiness score updates
- Risk zones → traffic lights change

### 6. **Team Updates** (Coaches)

- Athlete completes workout → coach sees it
- Wellness submitted → team status updates
- Performance logged → analytics refresh

## 🎯 How It Works

### Architecture

```
Database Change (Supabase)
        ↓
WebSocket Connection
        ↓
RealtimeService
        ↓
Component Updates
        ↓
UI Refreshes (Automatic)
```

### Implementation Pattern

```typescript
// 1. Extend RealtimeBaseComponent
export class MyComponent extends RealtimeBaseComponent implements OnInit {
  ngOnInit() {
    this.setupRealtimeSubscriptions();
  }

  // 2. Set up subscriptions
  private setupRealtimeSubscriptions() {
    const unsub = this.realtimeService.subscribeToTrainingSessions((event) =>
      this.handleUpdate(event),
    );
    this.addSubscription(unsub); // Auto-cleanup on destroy
  }

  // 3. Handle updates
  private handleUpdate(event: RealtimeEvent) {
    if (event.eventType === "INSERT") {
      // New record added
    } else if (event.eventType === "UPDATE") {
      // Record updated
    } else if (event.eventType === "DELETE") {
      // Record deleted
    }
  }
}
```

## 🔧 Services

### RealtimeService

Located: `src/app/core/services/realtime.service.ts`

**Available Subscriptions:**

- `subscribeToTrainingSessions(callback)` - Training data
- `subscribeToGames(callback)` - Game/match data
- `subscribeToWellness(callback)` - Wellness entries
- `subscribeToPerformance(callback)` - Performance metrics
- `subscribeToReadiness(callback)` - ACWR/readiness scores
- `subscribeToTeamUpdates(teamId, callback)` - Team data
- `subscribeToMessages(conversationId, callback)` - Chat messages

**Methods:**

- `unsubscribeAll()` - Close all connections
- `getActiveSubscriptions()` - List active channels
- `isSubscribed(channelName)` - Check if subscribed

**Signals:**

- `isConnected()` - Connection status (boolean)
- `connectionStatus()` - 'connected' | 'disconnected' | 'connecting'

### RealtimeBaseComponent

Located: `src/app/shared/components/realtime-base.component.ts`

**Usage:**

```typescript
export class MyComponent extends RealtimeBaseComponent {
  // Automatic subscription cleanup on destroy!
}
```

**Methods:**

- `addSubscription(unsubscribe)` - Register for cleanup
- `unsubscribeAll()` - Manual cleanup

## 🎨 UI Components

### Live Indicator

Located: `src/app/shared/components/live-indicator/live-indicator.component.ts`

**Usage:**

```html
<app-live-indicator
  [isLive]="realtimeService.isConnected()"
></app-live-indicator>
```

**Features:**

- Pulsing red dot when connected
- "LIVE" text indicator
- Gray when disconnected
- Auto-updates with connection status

## 📊 Example: Athlete Dashboard

The athlete dashboard now has real-time updates:

```typescript
export class AthleteDashboardComponent extends RealtimeBaseComponent {
  private setupRealtimeSubscriptions() {
    // Training sessions
    this.addSubscription(
      this.realtimeService.subscribeToTrainingSessions((event) => {
        this.loadTodayWorkload(userId);
        this.loadNextSession(userId);
      }),
    );

    // Readiness scores
    this.addSubscription(
      this.realtimeService.subscribeToReadiness((event) => {
        this.readinessService.calculateToday(userId).subscribe();
      }),
    );

    // Performance metrics
    this.addSubscription(
      this.realtimeService.subscribeToPerformance((event) => {
        this.loadTrends(userId);
      }),
    );
  }
}
```

## 🚀 Adding Real-Time to New Components

### Step 1: Extend Base Component

```typescript
export class NewComponent extends RealtimeBaseComponent implements OnInit {
```

### Step 2: Set Up Subscriptions

```typescript
ngOnInit() {
  this.setupRealtimeSubscriptions();
}

private setupRealtimeSubscriptions() {
  const unsub = this.realtimeService.subscribeToGames((event) => {
    // Handle game updates
    this.refreshGameData();
  });
  this.addSubscription(unsub);
}
```

### Step 3: Add Live Indicator (Optional)

```html
<app-live-indicator
  [isLive]="realtimeService.isConnected()"
></app-live-indicator>
```

## 🔐 Security

- **Row Level Security (RLS)**: Supabase enforces database permissions
- **User Filtering**: Only see your own data (or team data if coach)
- **Authenticated Only**: Must be logged in to receive updates
- **Secure WebSockets**: Encrypted connections

## ⚡ Performance

- **Efficient**: Only sends changes, not full datasets
- **Automatic Reconnection**: Handles network issues
- **Cleanup**: No memory leaks (automatic unsubscribe)
- **Scalable**: Supabase handles thousands of connections

## 🐛 Debugging

### Check Connection Status

```typescript
console.log("Connected:", this.realtimeService.isConnected());
console.log("Status:", this.realtimeService.connectionStatus());
console.log(
  "Active subscriptions:",
  this.realtimeService.getActiveSubscriptions(),
);
```

### Enable Console Logs

Real-time events are logged to console:

```
🔴 LIVE: Training session updated {...}
✅ Subscribed to training_sessions
🔌 Unsubscribed from training_sessions
```

### Common Issues

**No updates received:**

1. Check if logged in (needs authenticated user)
2. Verify Supabase Realtime is enabled on your tables
3. Check browser console for connection errors
4. Ensure Row Level Security allows SELECT

**Memory leaks:**

- Always extend `RealtimeBaseComponent` for automatic cleanup
- Or manually call `unsubscribeAll()` in `ngOnDestroy()`

## 📚 Next Steps

### Add Real-Time to More Components

1. **Game Tracker** - Live play-by-play
2. **Team Dashboard** (Coach) - Live athlete status
3. **Chat/Messaging** - Real-time messages
4. **Wellness Tracker** - Live wellness submissions
5. **Performance Tracking** - Live metric updates

### Enable Realtime in Supabase

Make sure Realtime is enabled for your tables:

```sql
-- Enable realtime for a table
ALTER PUBLICATION supabase_realtime ADD TABLE training_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE wellness_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE performance_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE readiness_scores;
```

## 🎉 Result

Your app now feels like a **live, collaborative platform** where data syncs instantly across all devices - just like modern apps like Slack, Google Docs, or Figma!

No more manual refresh buttons. No more stale data. Just instant, real-time updates. 🚀
