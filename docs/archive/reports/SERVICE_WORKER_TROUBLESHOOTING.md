# Service Worker Troubleshooting Guide

## 🚨 Issue: "Failed to fetch" Errors

If you're seeing repeated `TypeError: Failed to fetch` errors in your browser console from `sw.js`, this guide will help you resolve them.

## 🔍 Root Cause

The errors are caused by:
1. **Missing Resources**: The service worker was trying to cache resources that don't exist
2. **Poor Error Handling**: The old service worker didn't handle fetch failures gracefully
3. **Cache Conflicts**: Old cached data conflicting with new service worker

## ✅ Solution Implemented

### 1. Updated Service Worker (`public/sw.js`)
- **Better Error Handling**: Graceful handling of missing resources
- **Network-First Strategy**: Prioritizes network requests over cache
- **Smart Caching**: Only caches resources that actually exist
- **Fallback Responses**: Returns proper error responses instead of throwing

### 2. Service Worker Manager (`src/utils/serviceWorkerManager.js`)
- **Auto-Registration**: Automatically registers the service worker
- **Cleanup**: Unregisters old service workers and clears old caches
- **Update Management**: Handles service worker updates properly
- **Debugging**: Provides detailed logging and status information

### 3. Offline Page (`public/offline.html`)
- **Graceful Degradation**: Shows a proper offline page when network fails
- **Connection Monitoring**: Automatically detects when connection is restored
- **User-Friendly**: Clear messaging and retry functionality

## 🛠️ Manual Fix Steps

### Step 1: Clear Browser Data
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. In the left sidebar, click **Storage**
4. Click **Clear site data** button
5. Refresh the page

### Step 2: Unregister Service Workers
1. In DevTools, go to **Application** tab
2. Click **Service Workers** in the left sidebar
3. Click **Unregister** for any existing service workers
4. Refresh the page

### Step 3: Clear Cache
1. In DevTools, go to **Application** tab
2. Click **Storage** in the left sidebar
3. Expand **Cache Storage**
4. Right-click each cache and select **Delete**
5. Refresh the page

## 🔧 Browser Console Commands

Run these commands in your browser console to manually clear everything:

```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
  console.log('Service workers unregistered');
});

// Clear all caches
caches.keys().then(cacheNames => {
  cacheNames.forEach(cacheName => {
    caches.delete(cacheName);
    console.log('Cache deleted:', cacheName);
  });
});

// Reload the page
window.location.reload();
```

## 🚀 Quick Fix Script

Use the provided script to automatically clear everything:

```bash
# Run the clear script
node scripts/clear-service-worker.js
```

Or copy the console commands above and run them in your browser console.

## 📋 Verification Steps

After applying the fix, verify it worked:

1. **Check Console**: No more "Failed to fetch" errors
2. **Check Network Tab**: Requests should work normally
3. **Check Application Tab**: Service worker should be registered properly
4. **Test Offline**: Disconnect internet and verify offline page works

## 🔍 Debug Information

### Service Worker Status
Check the service worker status in the browser console:

```javascript
// Get service worker info
console.log(serviceWorkerManager.getInfo());
```

### Expected Output
```javascript
{
  supported: true,
  registered: true,
  state: "active",
  updateFound: false,
  controller: true,
  scope: "http://localhost:3000/"
}
```

## 🐛 Common Issues

### Issue 1: Service Worker Not Registering
**Symptoms**: No service worker in Application tab
**Solution**: Check browser console for registration errors

### Issue 2: Cache Not Clearing
**Symptoms**: Old cached data still showing
**Solution**: Use "Empty Cache and Hard Reload" (right-click refresh button)

### Issue 3: Offline Page Not Working
**Symptoms**: Blank page when offline
**Solution**: Verify `public/offline.html` exists and is accessible

### Issue 4: Development vs Production
**Symptoms**: Works in dev but not in production
**Solution**: Ensure service worker is served from root path in production

## 🔧 Development Tips

### 1. Disable Service Worker During Development
Add this to your browser console to disable service worker temporarily:

```javascript
// Disable service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

### 2. Enable Service Worker Logging
Add this to see detailed service worker logs:

```javascript
// Enable detailed logging
localStorage.setItem('sw-debug', 'true');
```

### 3. Test Offline Functionality
1. Open DevTools
2. Go to Network tab
3. Check "Offline" checkbox
4. Refresh the page
5. Verify offline page appears

## 📱 Mobile Testing

### iOS Safari
- Service workers are supported in iOS 11.3+
- May need to manually clear website data in Settings

### Android Chrome
- Service workers work well
- Use Chrome DevTools remote debugging

## 🔄 Update Process

When updating the service worker:

1. **Increment Version**: Update `CACHE_NAME` in `sw.js`
2. **Test Locally**: Verify changes work in development
3. **Deploy**: Push changes to production
4. **Monitor**: Check for any new errors

## 📞 Support

If you're still experiencing issues:

1. **Check Browser Console**: Look for specific error messages
2. **Verify Network**: Ensure all resources are accessible
3. **Test Different Browser**: Try Chrome, Firefox, Safari
4. **Clear Everything**: Use the manual steps above
5. **Check File Paths**: Ensure all referenced files exist

## 🎯 Prevention

To prevent future issues:

1. **Always Test**: Test service worker changes thoroughly
2. **Handle Errors**: Always include proper error handling
3. **Version Control**: Use version numbers for cache names
4. **Monitor Logs**: Check console for service worker errors
5. **Graceful Degradation**: Ensure app works without service worker

---

**Last Updated**: January 2025  
**Status**: ✅ Resolved  
**Version**: 2.0.0 