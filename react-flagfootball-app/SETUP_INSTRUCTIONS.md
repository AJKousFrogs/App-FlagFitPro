# FlagFit Pro Setup Instructions

## 🎨 Design System Overview

**FlagFit Pro uses a consistent branding system:**
- **Primary Color**: Green (#16A34A) for all interactive elements
- **Background**: White (#FFFFFF) for clean, modern appearance
- **Text**: Black (#111827) for excellent readability
- **Accents**: Green gradients for highlights and progress indicators
- **Borders**: Light gray (#E5E7EB) for subtle separation

**All pages maintain this consistent color scheme:**
- Login/Register: White backgrounds with green buttons
- Dashboard: White cards with green progress bars
- Training: Green gradients for challenges, white cards for content
- Profile/Community: Consistent white backgrounds with green accents

## PocketBase Setup Instructions

## Current Status
✅ Authentication service fixed - removed problematic caching
✅ Auto-cancellation issues resolved - added request deduplication  
✅ Test data prepared with placeholder user IDs
❌ User account needs to be created in PocketBase
❌ Collections need to be created in PocketBase

## Step 1: Create User Account

1. Go to http://127.0.0.1:8090/_/
2. Login with your admin credentials
3. Go to **Collections > users**
4. Click **"New record"**
5. Fill in the following details:
   ```
   email: aljosa@ljubljanafrogs.si
   password: Futsal12!!!
   passwordConfirm: Futsal12!!!
   name: Aljosa Kous
   firstName: Aljosa
   lastName: Kous
   role: admin
   ```
6. Click **Save**
7. **Copy the generated user ID** (you'll need this for the test data)

## Step 2: Create Collections

### training_sessions Collection
1. Go to **Collections** > **New collection**
2. Set **Name**: `training_sessions`
3. Set **Type**: `Base collection`
4. Add these fields:
   - `user_id` (Relation) → Collection: users, Required: Yes
   - `title` (Text) → Required: Yes, Max: 255
   - `description` (Text) → Max: 1000
   - `session_type` (Select) → Values: strength,agility,endurance,skills
   - `duration` (Number) → Min: 0, Max: 300
   - `date` (Date) → Required: Yes
   - `exercises` (JSON)
   - `completed` (Bool) → Default: false

### training_goals Collection  
1. Create new collection: `training_goals`
2. Add these fields:
   - `user_id` (Relation) → Collection: users, Required: Yes
   - `title` (Text) → Required: Yes, Max: 255
   - `description` (Text) → Max: 1000
   - `target_date` (Date)
   - `completed` (Bool) → Default: false
   - `progress` (Number) → Min: 0, Max: 100

### Set API Rules for Both Collections
```
List/Search: @request.auth.id != ""
View: @request.auth.id != ""
Create: @request.auth.id != "" && @request.data.user_id = @request.auth.id
Update: @request.auth.id != "" && user_id = @request.auth.id
Delete: @request.auth.id != "" && user_id = @request.auth.id
```

## Step 3: Update Test Data

1. Open `pocketbase-data/training_goals_fixed.json`
2. Replace all `"REPLACE_WITH_ACTUAL_USER_ID"` with your actual user ID
3. Open `pocketbase-data/training_sessions_simple.json`  
4. Replace all `"REPLACE_WITH_ACTUAL_USER_ID"` with your actual user ID

## Step 4: Import Test Data

1. Go to **Collections > training_goals**
2. Click **Import**
3. Upload `training_goals_fixed.json`
4. Go to **Collections > training_sessions**
5. Click **Import**
6. Upload `training_sessions_simple.json`

## Step 5: Test Authentication

1. Open http://127.0.0.1:3001 in your browser
2. Try logging in with:
   - Email: `aljosa@ljubljanafrogs.si`
   - Password: `Futsal12!!!`

## Troubleshooting

If you get authentication errors:
- Check that the user was created successfully
- Verify the email and password are correct
- Check browser console for detailed error messages

If data import fails:
- Verify all collections have the correct field types
- Make sure the user ID in the JSON files matches your actual user ID
- Try importing one record manually first to test the collection setup

## What Was Fixed

1. **Authentication Caching**: Removed problematic caching that was interfering with login
2. **Auto-cancellation**: Added request deduplication to prevent duplicate API calls
3. **Error Handling**: Improved error logging to identify authentication issues
4. **User Data**: Fixed name from "Urs" to "Kous" as requested

The app should now work properly once you complete the PocketBase setup above!