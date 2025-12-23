# 🔴 Real-time Data Setup Guide

## Quick Start

This guide shows you how to add real-time data updates to your FlagFit Pro pages.

---

## 📦 Installation (Already Done!)

The Supabase client is already installed and configured:

- ✅ Package: `@supabase/supabase-js@2.58.0`
- ✅ Client: `src/js/services/supabase-client.js`
- ✅ Auto-initialized on import

---

## 🚀 Basic Usage

### 1. Import the Helpers

```javascript
import { supabaseHelpers } from "./src/js/services/supabase-client.js";
```

### 2. Subscribe to Real-time Updates

```javascript
// Subscribe to new chat messages
const subscription = supabaseHelpers.subscribeToChatMessages(
  "team-general", // channel name
  (newMessage) => {
    // This callback runs when a new message arrives
    console.log("New message:", newMessage);
    displayMessage(newMessage); // Your function to show the message
  },
);
```

### 3. Clean Up When Done

```javascript
// Unsubscribe when leaving the page or component
subscription.unsubscribe();
```

---

## 📋 Real-world Examples

### Example 1: Live Chat (chat.html)

```javascript
// chat-page.js
import {
  supabaseHelpers,
  realtimeManager,
} from "../../js/services/supabase-client.js";

let chatSubscription = null;

async function initChatPage() {
  const currentChannel = "team-general";

  // Subscribe to new messages
  chatSubscription = supabaseHelpers.subscribeToChatMessages(
    currentChannel,
    (newMessage) => {
      // Add message to chat UI
      addMessageToChat({
        id: newMessage.id,
        user: newMessage.user_id,
        message: newMessage.content,
        timestamp: newMessage.created_at,
        avatar: newMessage.users?.avatar_url,
      });

      // Scroll to bottom
      scrollToBottom();

      // Play notification sound
      playNotificationSound();
    },
  );

  console.log("✅ Chat real-time enabled");
}

// Clean up when leaving page
window.addEventListener("beforeunload", () => {
  if (chatSubscription) {
    chatSubscription.unsubscribe();
  }
});
```

### Example 2: Live Notifications (All Pages)

```javascript
// notification-manager.js
import { supabaseHelpers } from "./js/services/supabase-client.js";
import { authManager } from "./auth-manager.js";

let notificationSubscription = null;

export async function initRealTimeNotifications() {
  const user = authManager.getUser();
  if (!user) return;

  // Subscribe to new notifications
  notificationSubscription = supabaseHelpers.subscribeToNotifications(
    user.id,
    (notification) => {
      // Show notification badge
      updateNotificationBadge();

      // Show toast notification
      showToast({
        title: notification.title,
        message: notification.message,
        type: notification.type,
      });

      // Play sound
      if (notification.type === "urgent") {
        playUrgentSound();
      }
    },
  );
}

// Call this when user logs in
authManager.onLogin(initRealTimeNotifications);
```

### Example 3: Live Game Tracking (game-tracker.html)

```javascript
// game-tracker-page.js
import { supabaseHelpers } from "../../js/services/supabase-client.js";

let gameSubscription = null;

async function initGameTracker(gameId) {
  // Subscribe to game updates
  gameSubscription = supabaseHelpers.subscribeToGameUpdates(
    gameId,
    (gameUpdate) => {
      const { eventType, new: newData, old: oldData } = gameUpdate;

      switch (eventType) {
        case "UPDATE":
          // Update score
          updateScoreboard(newData.home_score, newData.away_score);

          // Update game clock
          updateGameClock(newData.game_time);

          // Show what changed
          if (newData.home_score !== oldData.home_score) {
            showScoreAnimation("home", newData.home_score);
          }
          break;

        case "INSERT":
          // New game play recorded
          addPlayToTimeline(newData);
          break;
      }

      // Refresh stats
      refreshPlayerStats();
    },
  );
}

// Clean up
function cleanupGameTracker() {
  if (gameSubscription) {
    gameSubscription.unsubscribe();
  }
}
```

### Example 4: Community Feed (community.html)

```javascript
// community-page.js
import { supabaseHelpers } from "../../js/services/supabase-client.js";

let feedSubscription = null;

async function initCommunityFeed() {
  // Subscribe to new posts
  feedSubscription = supabaseHelpers.subscribeToCommunityPosts((newPost) => {
    // Add post to top of feed
    const postElement = createPostElement(newPost);
    const feedContainer = document.getElementById("community-feed");

    // Animate new post
    postElement.classList.add("new-post-animation");
    feedContainer.insertBefore(postElement, feedContainer.firstChild);

    // Show notification
    showNewPostNotification(newPost.users.name);
  });
}

// Clean up
window.addEventListener("beforeunload", () => {
  feedSubscription?.unsubscribe();
});
```

### Example 5: Training Progress (dashboard.html)

```javascript
// dashboard-page.js
import { supabaseHelpers } from "../../js/services/supabase-client.js";
import { authManager } from "../../auth-manager.js";

let trainingSubscription = null;

async function initTrainingUpdates() {
  const user = authManager.getUser();

  trainingSubscription = supabaseHelpers.subscribeToTrainingSessions(
    user.id,
    (update) => {
      const { eventType, new: newData } = update;

      if (eventType === "INSERT") {
        // New training session completed
        updateTrainingStats();
        refreshPerformanceChart();
        showAchievementUnlock(newData);
      } else if (eventType === "UPDATE") {
        // Training session updated
        refreshCurrentSession(newData);
      }
    },
  );
}
```

### Example 6: Tournament Bracket (tournaments.html)

```javascript
// tournaments-page.js
import { supabaseHelpers } from "../../js/services/supabase-client.js";

let tournamentSubscription = null;

async function initTournamentUpdates(tournamentId) {
  tournamentSubscription = supabaseHelpers.subscribeToTournaments(
    tournamentId,
    (update) => {
      // Refresh bracket
      loadTournamentBracket(tournamentId);

      // Show update notification
      if (update.eventType === "UPDATE") {
        const message = getTournamentUpdateMessage(update.new);
        showTournamentAlert(message);
      }
    },
  );
}
```

---

## 🔧 Advanced Usage

### Custom Subscription with Filters

```javascript
import { realtimeManager } from "./src/js/services/supabase-client.js";

// Subscribe to specific team's messages only
const teamSubscription = realtimeManager.subscribe(
  "chat_messages",
  {
    event: "INSERT",
    filter: `team_id=eq.${teamId}`,
  },
  (payload) => {
    console.log("Team message:", payload.new);
  },
);
```

### Subscribe to Multiple Events

```javascript
import { realtimeManager } from "./src/js/services/supabase-client.js";

// Subscribe to all game changes (INSERT, UPDATE, DELETE)
const gameSubscription = realtimeManager.subscribe(
  "games",
  {
    event: "*", // All events
    filter: `id=eq.${gameId}`,
  },
  (payload) => {
    switch (payload.eventType) {
      case "INSERT":
        console.log("New game created:", payload.new);
        break;
      case "UPDATE":
        console.log("Game updated:", payload.new);
        break;
      case "DELETE":
        console.log("Game deleted:", payload.old);
        break;
    }
  },
);
```

### Managing Multiple Subscriptions

```javascript
import { realtimeManager } from "./src/js/services/supabase-client.js";

// Create multiple subscriptions
const chatSub = supabaseHelpers.subscribeToChatMessages(
  "team-general",
  handleMessage,
);
const notifSub = supabaseHelpers.subscribeToNotifications(
  userId,
  handleNotification,
);
const gameSub = supabaseHelpers.subscribeToGameUpdates(
  gameId,
  handleGameUpdate,
);

// Check how many are active
console.log("Active subscriptions:", realtimeManager.getActiveCount());

// List all active subscriptions
console.log("Subscriptions:", realtimeManager.listActive());

// Clean up all at once
await realtimeManager.unsubscribeAll();
```

---

## 🎯 Best Practices

### 1. Always Unsubscribe

```javascript
// ✅ Good - Clean up subscriptions
let subscription = null;

function initPage() {
  subscription = supabaseHelpers.subscribeToChatMessages(channel, callback);
}

window.addEventListener("beforeunload", () => {
  subscription?.unsubscribe();
});

// ❌ Bad - Memory leak!
function initPage() {
  supabaseHelpers.subscribeToChatMessages(channel, callback);
  // No way to unsubscribe!
}
```

### 2. Handle Errors Gracefully

```javascript
// ✅ Good - Error handling
const subscription = supabaseHelpers.subscribeToChatMessages(
  channel,
  (message) => {
    try {
      displayMessage(message);
    } catch (error) {
      console.error("Failed to display message:", error);
      showErrorToast("Failed to load new message");
    }
  },
);

if (!subscription) {
  console.warn("Failed to set up real-time subscription");
  fallbackToPolling(); // Alternative approach
}
```

### 3. Debounce Rapid Updates

```javascript
import { debounce } from "./utils.js";

// ✅ Good - Debounce rapid updates
const debouncedRefresh = debounce(() => {
  refreshUI();
}, 500);

const subscription = supabaseHelpers.subscribeToGameUpdates(
  gameId,
  (update) => {
    debouncedRefresh();
  },
);
```

### 4. Use Connection Status

```javascript
import { getSupabase } from "./src/js/services/supabase-client.js";

const supabase = getSupabase();

// Monitor connection status
supabase
  .channel("connection-monitor")
  .on("system", { event: "*" }, (payload) => {
    if (payload.status === "SUBSCRIBED") {
      console.log("✅ Real-time connected");
      hideOfflineIndicator();
    } else if (payload.status === "CHANNEL_ERROR") {
      console.error("❌ Real-time connection error");
      showOfflineIndicator();
    }
  })
  .subscribe();
```

---

## 🧪 Testing Real-time

### Test in Browser Console

```javascript
// 1. Import the helper
import("./src/js/services/supabase-client.js").then(({ supabaseHelpers }) => {
  // 2. Subscribe to community posts
  const sub = supabaseHelpers.subscribeToCommunityPosts((post) => {
    console.log("📢 New post:", post);
  });

  // 3. Now create a post in Supabase Dashboard or another tab
  // You should see it logged here!

  // 4. Clean up
  // sub.unsubscribe();
});
```

### Test from Supabase Dashboard

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/pvziciccwxgftcielknm
2. Go to Table Editor
3. Select a table (e.g., `posts`)
4. Click "Insert row"
5. Fill in data and save
6. Check your browser console - you should see the update!

---

## 🔍 Debugging

### Enable Debug Logging

```javascript
import { logger } from "./src/logger.js";

// Set logger to debug mode
logger.setLevel("debug");

// Now you'll see detailed logs from Supabase client
```

### Check Subscription Status

```javascript
import { realtimeManager } from "./src/js/services/supabase-client.js";

// Get all active subscriptions
console.table(realtimeManager.listActive());

// Check connection count
console.log("Active connections:", realtimeManager.getActiveCount());
```

### View Channel Status in DevTools

```javascript
import { getSupabase } from "./src/js/services/supabase-client.js";

const supabase = getSupabase();

// Access the realtime connection
console.log("Realtime channels:", supabase.realtime.channels);
```

---

## 📚 API Reference

### supabaseHelpers

#### `subscribeToChatMessages(channel, callback)`

Subscribe to new chat messages in a channel.

**Parameters:**

- `channel` (string): Channel name (e.g., 'team-general')
- `callback` (function): Called with new message data

**Returns:** Subscription object with `unsubscribe()` method

---

#### `subscribeToNotifications(userId, callback)`

Subscribe to user notifications.

**Parameters:**

- `userId` (string): User ID
- `callback` (function): Called with new notification data

**Returns:** Subscription object

---

#### `subscribeToTeamUpdates(teamId, callback)`

Subscribe to team changes.

**Parameters:**

- `teamId` (string): Team ID
- `callback` (function): Called with team update

**Returns:** Subscription object

---

#### `subscribeToGameUpdates(gameId, callback)`

Subscribe to game updates (scores, plays, etc.).

**Parameters:**

- `gameId` (string): Game ID (optional - omit to subscribe to all games)
- `callback` (function): Called with game update

**Returns:** Subscription object

---

#### `subscribeToCommunityPosts(callback)`

Subscribe to new community posts.

**Parameters:**

- `callback` (function): Called with new post data

**Returns:** Subscription object

---

#### `subscribeToTrainingSessions(userId, callback)`

Subscribe to training session updates.

**Parameters:**

- `userId` (string): User ID
- `callback` (function): Called with training update

**Returns:** Subscription object

---

#### `subscribeToTournaments(tournamentId, callback)`

Subscribe to tournament updates.

**Parameters:**

- `tournamentId` (string): Tournament ID (optional)
- `callback` (function): Called with tournament update

**Returns:** Subscription object

---

### realtimeManager

#### `subscribe(table, options, callback)`

Low-level subscription method.

**Parameters:**

- `table` (string): Table name
- `options` (object):
  - `event` (string): 'INSERT', 'UPDATE', 'DELETE', or '\*'
  - `filter` (string): SQL filter (e.g., 'id=eq.123')
  - `schema` (string): Schema name (default: 'public')
- `callback` (function): Called with change payload

**Returns:** Subscription object

---

#### `unsubscribe(channelName)`

Unsubscribe from a specific channel.

**Parameters:**

- `channelName` (string): Channel name

---

#### `unsubscribeAll()`

Unsubscribe from all channels.

**Returns:** Promise

---

#### `getActiveCount()`

Get number of active subscriptions.

**Returns:** Number

---

#### `listActive()`

List all active subscriptions.

**Returns:** Array of subscription info

---

## ✅ Checklist

Before implementing real-time on a page:

- [ ] Import `supabaseHelpers` from `supabase-client.js`
- [ ] Create subscription when page/component loads
- [ ] Store subscription reference for cleanup
- [ ] Implement callback function to handle updates
- [ ] Add error handling in callback
- [ ] Unsubscribe when page/component unloads
- [ ] Test with real data changes
- [ ] Add user feedback (animations, sounds, toasts)
- [ ] Handle connection errors gracefully
- [ ] Consider debouncing rapid updates

---

## 🎉 You're Ready!

You now have everything you need to add real-time data to your FlagFit Pro application. Start with a simple use case (like notifications or chat) and expand from there.

**Questions?** Check the main diagnostic report: `API_CONNECTION_DIAGNOSTIC_REPORT.md`

**Happy coding! 🏈**
