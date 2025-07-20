# PocketBase Setup Guide for Flag Football Training App

## Prerequisites

1. Download PocketBase from https://pocketbase.io/docs/
2. Extract the executable to your project directory
3. Make sure you have the React app running

## Step 1: Initialize PocketBase

```bash
# Make PocketBase executable (macOS/Linux)
chmod +x pocketbase

# Start PocketBase server
./pocketbase serve
```

PocketBase will start on `http://127.0.0.1:8090`

## Step 2: Admin Setup

1. Open `http://127.0.0.1:8090/_/` in your browser
2. Create an admin account (first time only)
3. Log in to the admin interface

## Step 3: Create Collections

### Users Collection (Auth)
1. Go to "Collections" → "New Collection"
2. Select "Auth collection"
3. Name: `users`
4. Add the following fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| name | Text | Yes | min: 2, max: 100 |
| position | Select | No | Values: Quarterback, Running Back, Wide Receiver, Center, Guard, Cornerback, Safety, Linebacker, Rusher |
| experience | Select | No | Values: Beginner, Intermediate, Advanced, Elite |
| preferredHand | Select | No | Values: Right, Left, Ambidextrous |
| height | Text | No | - |
| weight | Number | No | - |
| age | Number | No | - |
| bio | Text | No | max: 500 |
| avatar | Text | No | - |
| goals | JSON | No | - |
| level | Number | No | default: 1 |
| xp | Number | No | default: 0 |
| streakDays | Number | No | default: 0 |
| totalSessions | Number | No | default: 0 |
| totalHours | Number | No | default: 0 |

### Training Sessions Collection
1. Create "Base collection"
2. Name: `training_sessions`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| user | Relation | Yes | Collection: users, Cascade delete, Single select |
| title | Text | Yes | min: 1, max: 200 |
| type | Select | Yes | Values: routes, speed, plyometrics, catching, strength, recovery, custom |
| duration | Number | Yes | - |
| exercises | JSON | No | - |
| notes | Text | No | - |
| completed | Bool | No | default: false |
| completedAt | Date | No | - |
| xpEarned | Number | No | default: 0 |
| metrics | JSON | No | - |

### Progress Photos Collection
1. Create "Base collection"
2. Name: `progress_photos`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| user | Relation | Yes | Collection: users, Cascade delete, Single select |
| title | Text | Yes | min: 1, max: 200 |
| category | Select | Yes | Values: form, physique, flexibility, achievements |
| photo | File | Yes | Max: 1 file, 5MB, Types: image/jpeg, image/png, image/webp |
| notes | Text | No | max: 500 |
| tags | JSON | No | - |

### Weekly Challenges Collection
1. Create "Base collection"
2. Name: `weekly_challenges`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | Yes | min: 1, max: 200 |
| description | Text | Yes | max: 500 |
| difficulty | Select | Yes | Values: Beginner, Intermediate, Advanced |
| xpReward | Number | Yes | - |
| badge | Text | No | - |
| startDate | Date | Yes | - |
| endDate | Date | Yes | - |
| status | Select | Yes | Values: active, upcoming, completed |
| requirements | JSON | No | - |
| dailyTasks | JSON | No | - |
| participants | Number | No | default: 0 |

### Challenge Enrollments Collection
1. Create "Base collection"
2. Name: `challenge_enrollments`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| user | Relation | Yes | Collection: users, Cascade delete, Single select |
| challenge | Relation | Yes | Collection: weekly_challenges, Cascade delete, Single select |
| enrolledAt | Date | Yes | - |
| completedTasks | JSON | No | - |
| totalXP | Number | No | default: 0 |
| completed | Bool | No | default: false |
| completedAt | Date | No | - |
| finalScore | Number | No | - |
| rank | Number | No | - |

### Scheduled Workouts Collection
1. Create "Base collection"
2. Name: `scheduled_workouts`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| user | Relation | Yes | Collection: users, Cascade delete, Single select |
| date | Date | Yes | - |
| time | Text | No | - |
| type | Select | Yes | Values: routes, speed, plyometrics, catching, strength, recovery |
| name | Text | Yes | min: 1, max: 200 |
| duration | Number | No | - |
| completed | Bool | No | default: false |
| notes | Text | No | - |

### Drill Library Collection
1. Create "Base collection"
2. Name: `drill_library`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| name | Text | Yes | min: 1, max: 200 |
| category | Select | Yes | Values: routes, catching, speed, agility, plyometrics, strength |
| difficulty | Select | Yes | Values: Beginner, Intermediate, Advanced |
| duration | Number | Yes | - |
| equipment | JSON | No | - |
| instructions | JSON | Yes | - |
| keyPoints | JSON | No | - |
| variations | JSON | No | - |
| videoUrl | Text | No | - |
| tags | JSON | No | - |

### User Achievements Collection
1. Create "Base collection"
2. Name: `user_achievements`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| user | Relation | Yes | Collection: users, Cascade delete, Single select |
| achievementId | Text | Yes | - |
| name | Text | Yes | - |
| icon | Text | Yes | - |
| earnedAt | Date | Yes | - |
| xpReward | Number | No | default: 0 |

### Offline Workouts Collection
1. Create "Base collection"
2. Name: `offline_workouts`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| user | Relation | Yes | Collection: users, Cascade delete, Single select |
| workoutId | Text | Yes | - |
| title | Text | Yes | - |
| category | Select | Yes | Values: speed, routes, strength, agility, endurance, flexibility |
| workoutData | JSON | Yes | - |
| downloadedAt | Date | Yes | - |
| lastUsed | Date | No | - |
| timesCompleted | Number | No | default: 0 |

### Analytics Metrics Collection
1. Create "Base collection"
2. Name: `analytics_metrics`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| user | Relation | Yes | Collection: users, Cascade delete, Single select |
| date | Date | Yes | - |
| metricType | Select | Yes | Values: speed, form, endurance, strength, flexibility, technique |
| value | Number | Yes | - |
| unit | Text | Yes | - |
| context | JSON | No | - |
| notes | Text | No | - |

## Step 4: Configure API Rules

For each collection, go to "Settings" tab and set these API rules:

### Users Collection
- List rule: `@request.auth.id != ""`
- View rule: `@request.auth.id != "" && id = @request.auth.id`
- Create rule: `` (empty - allow registration)
- Update rule: `@request.auth.id != "" && id = @request.auth.id`
- Delete rule: `@request.auth.id != "" && id = @request.auth.id`

### All Other Collections (user-specific data)
- List rule: `@request.auth.id != "" && user = @request.auth.id`
- View rule: `@request.auth.id != "" && user = @request.auth.id`
- Create rule: `@request.auth.id != ""`
- Update rule: `@request.auth.id != "" && user = @request.auth.id`
- Delete rule: `@request.auth.id != "" && user = @request.auth.id`

### Public Collections (drill_library, weekly_challenges)
- List rule: `@request.auth.id != ""`
- View rule: `@request.auth.id != ""`
- Create rule: `` (empty - admin only)
- Update rule: `` (empty - admin only)
- Delete rule: `` (empty - admin only)

## Step 5: Seed Data (Optional)

### Create Sample Weekly Challenges
Go to "Records" for `weekly_challenges` and create:

1. **Speed Demon Week**
   - title: "Speed Demon Week"
   - description: "Focus on explosive speed and acceleration drills"
   - difficulty: "Intermediate"
   - xpReward: 500
   - badge: "⚡ Speed Demon Master"
   - status: "active"
   - Add sample requirements and daily tasks as JSON

2. **Route Running Mastery**
   - title: "Route Running Mastery"
   - description: "Perfect your route running technique and precision"
   - difficulty: "Advanced"
   - xpReward: 600
   - badge: "🎯 Route Master Elite"
   - status: "upcoming"

### Create Sample Drills
Go to "Records" for `drill_library` and add sample drills from the existing DrillLibrary component.

## Step 6: Test Connection

1. Update your React app's PocketBase URL in `src/services/pocketbase.js`
2. Test user registration and login
3. Test creating and fetching data
4. Verify file uploads work for progress photos

## Step 7: Environment Variables

Create `.env.local` in your React app:

```env
REACT_APP_POCKETBASE_URL=http://127.0.0.1:8090
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: PocketBase handles CORS automatically for localhost
2. **File Upload Issues**: Check max file size in collection settings
3. **Auth Issues**: Verify API rules are set correctly
4. **Relation Issues**: Ensure related collections exist before creating relations

### Useful Commands
```bash
# Reset database (be careful!)
./pocketbase serve --dev

# Backup database
cp pb_data/data.db pb_data/backup_$(date +%Y%m%d_%H%M%S).db

# View logs
tail -f pb_data/logs/*.log
```

## Production Deployment

For production deployment:
1. Set up PocketBase on your server
2. Configure proper API rules
3. Set up SSL certificates
4. Update REACT_APP_POCKETBASE_URL to your production URL
5. Consider using Docker for deployment

## Next Steps

After setup:
1. Update React contexts to use real PocketBase data
2. Implement file upload functionality
3. Add real-time subscriptions for live updates
4. Set up backup strategies
5. Monitor performance and optimize queries