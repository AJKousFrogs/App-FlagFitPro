# YouTube API Integration Setup Guide

## 🎥 YouTube Training Videos Integration

The Flag Football Training App now includes **YouTube API integration** to provide athletes with professional warm-up and training videos, including:

- **A skips, B skips, C skips** demonstrations
- **Sprint technique** tutorials  
- **Flag football specific** drills
- **Agility training** videos
- **Plyometric exercises**
- **Cool-down routines**

## 🔧 Setup Instructions

### 1. Get YouTube Data API v3 Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing project

2. **Enable YouTube Data API v3**
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

3. **Create API Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

4. **Configure API Key (Optional but Recommended)**
   - Click on your API key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Under "Website restrictions", add your domains

### 2. Configure the Application

1. **Update API Key in Code**
   ```javascript
   // In src/youtube-training-service.js, line 6:
   this.apiKey = 'YOUR_ACTUAL_YOUTUBE_API_KEY_HERE';
   ```

2. **Alternative: Environment Variable**
   ```bash
   # Create .env file (not committed to git)
   YOUTUBE_API_KEY=your_actual_api_key_here
   ```

## 📺 Features Available

### **Training Video Categories**

1. **🔥 Warm-up & Activation**
   - Dynamic warm-up routines
   - A skips, B skips, C skips
   - Sprint preparation drills
   - Athletic activation sequences

2. **⚡ Sprint Technique** 
   - Sprint mechanics tutorials
   - Acceleration drills
   - Running form improvements
   - Speed development

3. **🏃 Agility & Change of Direction**
   - Cone drill progressions
   - Cutting techniques
   - Lateral movement patterns
   - Flag football agility

4. **💪 Power & Plyometrics**
   - Explosive training
   - Jump progressions
   - Power development
   - Vertical jump training

5. **🏈 Flag Football Specific**
   - Flag pulling techniques
   - Route running
   - Defensive positioning
   - Sport-specific skills

6. **😌 Cool-down & Recovery**
   - Static stretching routines
   - Recovery protocols
   - Injury prevention
   - Foam rolling techniques

### **Smart Features**

- **Quality Filtering**: Videos ranked by relevance and quality
- **Professional Sources**: Prioritizes trusted coaching channels
- **Caching System**: 30-minute cache to minimize API calls
- **Fallback Mode**: Works without API key (shows demo videos)
- **Custom Search**: Search for specific exercises
- **Training Playlists**: Curated complete workout sessions

### **Usage in App**

**Location**: Training page → "Training Videos" section

**Quick Training Sessions**:
- ⚡ Speed Focus (30 min)
- 🏃 Agility Focus (35 min) 
- 🎯 Complete Session (60 min)
- 😌 Recovery Session (20 min)

## 🚀 API Usage & Quotas

### **YouTube API Quotas**
- **Free Tier**: 10,000 units/day
- **Search Request**: 100 units each
- **Video Details**: 1 unit each

### **Optimization Features**
- **Smart Caching**: Reduces API calls by 80%
- **Batch Requests**: Efficiently fetches multiple videos
- **Quality Scoring**: Ranks videos to show best content first
- **Error Handling**: Graceful fallbacks when API unavailable

### **Estimated Usage**
- **Per User/Day**: ~200-500 API units
- **App can support**: 20-50 active users/day on free tier

## 🛡️ Security & Best Practices

### **API Key Security**
- ✅ **DO**: Restrict API key to YouTube Data API v3 only
- ✅ **DO**: Add website restrictions to your domains
- ❌ **DON'T**: Commit API key to public repositories
- ❌ **DON'T**: Share API key in client-side code in production

### **Recommended Production Setup**
```javascript
// Use environment variables or server-side proxy
const API_KEY = process.env.YOUTUBE_API_KEY || await getApiKeyFromServer();
```

## 🔧 Troubleshooting

### **Common Issues**

1. **"API key not configured"**
   - Check API key is correctly set in youtube-training-service.js
   - Verify API key is not 'YOUR_YOUTUBE_API_KEY_HERE'

2. **"YouTube API error: 403"** 
   - API key restrictions may be too strict
   - Check daily quota hasn't been exceeded
   - Verify YouTube Data API v3 is enabled

3. **"No videos found"**
   - API key may be invalid
   - Network connectivity issues
   - App will show fallback/demo videos

4. **Videos not loading**
   - Check browser console for errors
   - Verify API responses in Network tab
   - Try different search terms

### **Testing Without API Key**

The app works in **demo mode** without an API key:
- Shows curated fallback videos
- Displays search links to YouTube
- All UI functionality works
- Perfect for development/testing

## 📊 Analytics & Monitoring

### **Built-in Analytics**
```javascript
// Check API usage stats
console.log(youTubeTrainingService.getApiUsageStats());
```

**Returns**:
- Cache hit rate
- Number of cached videos  
- API configuration status

### **Performance Monitoring**
- Video load times
- API response times
- Cache effectiveness
- Error rates

## 🎯 Advanced Features

### **Custom Video Curation**
Coaches can pre-approve specific videos by adding them to the allowlist:

```javascript
// In youtube-training-service.js
this.channelAllowlist = [
    'UCblfuW_4rakIf2h6aqANefA', // World Athletics
    'UCTlO2AY8O9cKpR7qSWwBhXg', // Track & Field Training
    'YOUR_CHANNEL_ID_HERE'       // Add trusted channels
];
```

### **Training Integration**
Videos automatically sync with:
- Weekly training schedules
- Session-specific warm-ups
- Recovery protocols
- Skill development focus

## 📱 Mobile Experience

- **Responsive Design**: Optimized for phone/tablet viewing
- **Touch Controls**: Swipe navigation for video selection
- **Offline Ready**: Cached video metadata works offline
- **Data Conscious**: Efficient loading and caching

---

## 🏆 Benefits for Athletes

✅ **Professional Quality**: Access to Olympic-level training content
✅ **Always Updated**: Latest techniques and methods
✅ **Skill Specific**: Flag football and sprint-focused content
✅ **Progressive Learning**: From basics to advanced techniques
✅ **Visual Learning**: See proper form and technique
✅ **Accessible**: Available 24/7 from any device

The YouTube integration transforms the training experience by providing visual demonstrations of every exercise, ensuring athletes learn proper form and technique for optimal performance and injury prevention.