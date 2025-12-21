# 🌤️ How to Get Free OpenWeatherMap API Key

## Quick Steps

### 1. Sign Up for Free Account

1. **Go to OpenWeatherMap:**
   - Visit: https://openweathermap.org/api
   - Click **"Sign Up"** or **"Sign In"** (top right)

2. **Create Account:**
   - Fill in your email, username, and password
   - Accept terms and conditions
   - Click **"Create Account"**

3. **Verify Email:**
   - Check your email inbox
   - Click the verification link from OpenWeatherMap
   - You'll be redirected to the dashboard

### 2. Get Your API Key

1. **Navigate to API Keys:**
   - After logging in, go to: https://home.openweathermap.org/api_keys
   - Or click **"API keys"** in the top menu

2. **Create/View API Key:**
   - You'll see a default API key (or create a new one)
   - Click **"Generate"** if you need a new key
   - Give it a name (e.g., "FlagFit Pro App")

3. **Copy Your API Key:**
   - The key will look like: `abc123def456ghi789jkl012mno345pqr`
   - Click the copy icon or select and copy it

### 3. Add to Netlify

1. **Go to Netlify Dashboard:**
   - Visit: https://app.netlify.com/
   - Select your site → **Site Settings** → **Environment Variables**

2. **Add Variable:**
   - Click **"Add a variable"**
   - **Key:** `OPENWEATHER_API_KEY`
   - **Value:** Paste your API key (e.g., `abc123def456ghi789jkl012mno345pqr`)
   - **Scope:** All scopes
   - Click **"Create variable"**

3. **Redeploy:**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Deploy site"**
   - Or push a new commit to trigger auto-deploy

## Free Tier Limits

✅ **What You Get (Free):**
- 60 calls/minute
- 1,000,000 calls/month
- Current weather data
- 5-day/3-hour forecast
- Weather maps

❌ **What's Not Included:**
- Historical weather data
- 16-day forecast
- Advanced weather alerts

**For your app:** The free tier is more than enough! You'll get:
- Current weather for training sessions
- Weather suitability calculations
- Location-based weather data

## Testing Your API Key

### Test in Browser

Visit this URL (replace `YOUR_API_KEY` with your actual key):
```
https://api.openweathermap.org/data/2.5/weather?q=San%20Francisco&appid=YOUR_API_KEY&units=imperial
```

**Expected Response:**
```json
{
  "coord": { "lon": -122.42, "lat": 37.77 },
  "weather": [{ "main": "Clear", "description": "clear sky" }],
  "main": { "temp": 68.5, "humidity": 65 },
  "wind": { "speed": 5.2 },
  ...
}
```

### Test Your Netlify Function

After adding the variable and redeploying:

```bash
curl "https://your-site.netlify.app/api/weather/current?lat=40.7128&lon=-74.0060"
```

Should return weather data instead of mock data.

## Troubleshooting

### ❌ "Invalid API key" Error

**Causes:**
- API key not activated yet (wait 10-60 minutes after signup)
- Wrong API key copied
- API key deleted/regenerated

**Solution:**
- Wait a few minutes after creating account
- Double-check the key is correct
- Make sure you copied the entire key

### ❌ "401 Unauthorized" Error

**Causes:**
- API key not set in Netlify
- Variable name misspelled (`OPENWEATHER_API_KEY` must be exact)
- Not redeployed after adding variable

**Solution:**
- Check Netlify environment variables
- Verify variable name is exactly `OPENWEATHER_API_KEY`
- Trigger a new deploy

### ❌ Rate Limit Exceeded

**Causes:**
- Too many requests (free tier: 60/minute)

**Solution:**
- Wait a minute before trying again
- Check your app isn't making too many requests
- Consider caching weather data

## What Happens Without API Key?

If `OPENWEATHER_API_KEY` is not set:
- Weather endpoint still works ✅
- Returns mock/example weather data ✅
- Training suitability uses default values ✅
- No errors, just not real weather data ⚠️

So the app works fine without it, but you'll get real weather data once you add it!

## Quick Reference

**API Key Location:**
- Dashboard: https://home.openweathermap.org/api_keys
- Sign Up: https://home.openweathermap.org/users/sign_up

**Netlify Variable:**
- Name: `OPENWEATHER_API_KEY`
- Value: Your API key from OpenWeatherMap
- Scope: All scopes

**API Documentation:**
- Current Weather: https://openweathermap.org/current
- API Guide: https://openweathermap.org/api

---

**That's it!** Once you add the API key to Netlify and redeploy, your weather endpoints will use real weather data! 🌤️

