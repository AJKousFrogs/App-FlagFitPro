# 🎛️ Quick Toggle: Enable Hover Preview Feature

## 🚀 Want videos to auto-play on hover?

The hover preview feature is **built-in but disabled by default** to save bandwidth. You can easily enable it!

---

## ✅ How to Enable

### Step 1: Open the Component File

```bash
angular/src/app/features/training/video-feed/video-feed.component.ts
```

### Step 2: Find Line ~540

Look for:
```typescript
// 🎥 OPTIONAL: Hover preview feature (disabled by default)
enableHoverPreview = signal(false); // Set to true to enable hover-to-play
```

### Step 3: Change to `true`

```typescript
enableHoverPreview = signal(true); // ✅ ENABLED!
```

### Step 4: Save & Reload

That's it! Now when users hover over a video card for 1+ second, the actual Instagram video will load and play.

---

## 🎨 How It Works

### Before Hover:
- Shows thumbnail image
- Lightweight and fast
- Play icon overlay

### After 1s Hover (Desktop Only):
- Thumbnail fades out
- Instagram embed loads
- Video starts playing
- Smooth fade-in animation

### On Mouse Leave:
- Returns to thumbnail
- Stops video playback
- No bandwidth wasted

---

## 📱 Mobile Behavior

**Hover preview is automatically disabled on mobile** (≤768px width) to:
- ✅ Save mobile data
- ✅ Preserve battery life
- ✅ Maintain fast loading
- ✅ Prevent accidental triggers

---

## ⚙️ Configuration Options

### Change Hover Delay

Currently set to 1 second. To change:

```typescript
// video-feed.component.ts - in onVideoCardHover() method
this.hoverTimer = setTimeout(() => {
  this.hoveringVideoId.set(video.id);
}, 1500); // Change to 1.5 seconds (or any value in ms)
```

### Disable for Specific Videos

```typescript
onVideoCardHover(video: InstagramVideo): void {
  if (!this.enableHoverPreview() || window.innerWidth <= 768) {
    return;
  }

  // Skip hover preview for certain videos
  if (video.duration && video.duration > 60) {
    return; // Don't preview videos longer than 60s
  }

  // ... rest of method
}
```

---

## 📊 Performance Impact

### With Hover Preview Enabled:

**Bandwidth:**
- Only loads when user hovers
- ~2-3MB per video preview
- No wasted data if not hovered

**User Experience:**
- ⭐⭐⭐⭐⭐ Engagement (much higher)
- ⭐⭐⭐⭐ Performance (good)
- ⭐⭐⭐⭐⭐ Desktop experience
- ⭐⭐⭐ Mobile (auto-disabled)

### Recommendation:

✅ **Enable for:**
- Desktop users
- WiFi connections
- High-engagement scenarios
- Demo/showcase environments

❌ **Keep disabled for:**
- Mobile-first audiences
- Limited bandwidth users
- 3G/4G heavy traffic
- Data-conscious users

---

## 🎯 Quick A/B Test

Want to test both experiences?

### Option 1: Toggle Button (Add to UI)

```typescript
// Add to component
<button 
  pButton 
  [label]="enableHoverPreview() ? 'Hover Preview: ON' : 'Hover Preview: OFF'"
  (click)="toggleHoverPreview()"
  class="p-button-text p-button-sm"
></button>

// Add method
toggleHoverPreview(): void {
  this.enableHoverPreview.update(v => !v);
  this.toastService.info(
    this.enableHoverPreview() 
      ? 'Hover preview enabled' 
      : 'Hover preview disabled'
  );
}
```

### Option 2: URL Parameter

```typescript
// In ngOnInit()
const urlParams = new URLSearchParams(window.location.search);
const enableHover = urlParams.get('hover') === 'true';
this.enableHoverPreview.set(enableHover);

// Usage:
// ?hover=true  - Enable hover preview
// ?hover=false - Disable hover preview
```

---

## 🐛 Troubleshooting

### Videos Not Loading on Hover?

1. **Check console for errors**
   - Instagram embed blocked?
   - CORS issues?

2. **Verify enabled status**
   ```typescript
   console.log('Hover preview enabled:', this.enableHoverPreview());
   ```

3. **Check screen width**
   ```typescript
   console.log('Window width:', window.innerWidth);
   // Should be > 768 for feature to work
   ```

### Videos Loading Too Slow?

1. **Increase hover delay**
   - Change from 1000ms to 1500ms or 2000ms
   - Gives more time before loading

2. **Check connection speed**
   - Feature works best on WiFi/4G+
   - May be slow on 3G

---

## 📝 Code Location Reference

```
angular/src/app/features/training/video-feed/
├── video-feed.component.ts
│   ├── Line ~540: enableHoverPreview signal
│   ├── Line ~770: onVideoCardHover() method
│   ├── Line ~790: onVideoCardLeave() method
│   └── Line ~800: isPreviewingVideo() method
│
└── video-feed.component.scss
    └── Line ~520: .video-preview-container styles
```

---

## ✅ Quick Checklist

- [ ] Open `video-feed.component.ts`
- [ ] Find `enableHoverPreview = signal(false)`
- [ ] Change to `enableHoverPreview = signal(true)`
- [ ] Save file
- [ ] Reload app
- [ ] Test on desktop (hover over video cards)
- [ ] Test on mobile (should be auto-disabled)

---

**Feature Status:** ✅ Built and Ready  
**Default State:** Disabled (for bandwidth optimization)  
**Toggle:** One line change  
**Mobile:** Auto-disabled  
**Performance:** Optimized with 1s delay
