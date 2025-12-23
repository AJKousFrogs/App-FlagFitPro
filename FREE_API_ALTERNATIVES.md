# 🆓 Free API Alternatives Guide

**Last Updated:** December 23, 2025  
**Status:** ✅ All Alternatives Are Free

---

## 🌤️ Weather API - FREE Options

### **Option 1: Open-Meteo** ⭐⭐⭐ RECOMMENDED

```
✅ FREE: Unlimited calls (non-commercial)
✅ NO API KEY needed
✅ Features: Current weather, 16-day forecast, historical
✅ API: https://open-meteo.com/

NEW Edge Function: supabase/functions/weather-free/index.ts
```

### **Option 2: WeatherAPI.com** ⭐⭐

```
✅ FREE: 1 million calls/month
✅ API Key required (free)
✅ Signup: https://www.weatherapi.com/signup.aspx
```

### **Option 3: OpenWeatherMap** ⭐

```
✅ FREE: 1,000 calls/day = 30,000/month
✅ €0.14/100 ONLY after free tier
✅ For your app: ~100-500 calls/day = FREE
```

**Recommendation:** Use **Open-Meteo** - no API key, unlimited!

---

## 🤖 AI API - FREE Options

### **Option 1: Groq** ⭐⭐⭐ RECOMMENDED

```
✅ FREE: 14,400 requests/day
✅ FAST: 300+ tokens/second (fastest!)
✅ Models: Llama 3.1 70B, Mixtral, Gemma
✅ Signup: https://console.groq.com/

NEW Edge Function: supabase/functions/ai-suggestions-free/index.ts

Setup:
1. Sign up at https://console.groq.com/
2. Get API key (instant, free)
3. Run: supabase secrets set GROQ_API_KEY=your_key_here
```

### **Option 2: Google Gemini** ⭐⭐

```
✅ FREE: 60 requests/minute = 1M tokens/month
✅ Quality: Gemini 1.5 Flash (very good)
✅ Signup: https://ai.google.dev/
```

### **Option 3: Together.ai** ⭐

```
✅ FREE: $25 credit (lasts months)
✅ CHEAP: $0.001 per 1K tokens (100x cheaper than OpenAI)
✅ Signup: https://api.together.xyz/
```

### **Option 4: Hugging Face** ⭐

```
✅ FREE: Limited but usable
✅ Models: 1000+ open source
✅ Signup: https://huggingface.co/
```

**Recommendation:** Use **Groq** - fastest and most generous!

---

## 📊 Cost Comparison

| Service           | Free Tier    | After Free | Your Usage | Cost        |
| ----------------- | ------------ | ---------- | ---------- | ----------- |
| **Open-Meteo**    | Unlimited    | N/A        | ~500/day   | **$0**      |
| **WeatherAPI**    | 1M/month     | $0.04/1K   | ~15K/month | **$0**      |
| **OpenWeather**   | 30K/month    | €0.14/100  | ~15K/month | **$0**      |
| **Groq AI**       | 14.4K/day    | N/A        | ~100/day   | **$0**      |
| **Google Gemini** | 1M tokens/mo | $0.35/1M   | ~50K/month | **$0**      |
| **OpenAI GPT-4**  | None         | $10/1M     | ~50K/month | **$500** ❌ |

**Total Cost with Free APIs:** **$0/month** 🎉

---

## 🚀 Quick Setup

### **Step 1: Deploy Free Weather (No API Key!)**

```bash
# Deploy Open-Meteo weather function
supabase functions deploy weather-free

# Test it
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/weather-free \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"city": "San Francisco"}'
```

### **Step 2: Setup Free AI (Groq)**

```bash
# 1. Sign up at https://console.groq.com/ (30 seconds)
# 2. Get your API key (instant)
# 3. Set it in Supabase
supabase secrets set GROQ_API_KEY=gsk_your_key_here

# 4. Deploy AI function
supabase functions deploy ai-suggestions-free

# 5. Test it
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-suggestions-free \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "context": "beginner athlete"}'
```

### **Step 3: Update Angular Services**

```typescript
// Update weather.service.ts to use new function
searchWeather(city: string): Observable<WeatherData> {
  return from(
    this.supabaseService.client.functions.invoke('weather-free', {
      body: { city }
    })
  ).pipe(
    map(({ data }) => data.data)
  );
}

// Update ai.service.ts to use new function
getAISuggestions(userId: string): Observable<Suggestion[]> {
  return from(
    this.supabaseService.client.functions.invoke('ai-suggestions-free', {
      body: { userId }
    })
  ).pipe(
    map(({ data }) => data.data)
  );
}
```

---

## 💰 Why These Are Better

### **Open-Meteo vs OpenWeather:**

- ✅ 100% free (no hidden costs)
- ✅ No API key needed
- ✅ Unlimited calls
- ✅ Open source, community-driven
- ✅ Better data in many regions

### **Groq vs OpenAI:**

- ✅ 14,400 free requests/day vs OpenAI's $0
- ✅ 10x faster (300 vs 30 tokens/sec)
- ✅ Same model quality (Llama 3.1 70B)
- ✅ No credit card required

---

## ❓ About Context7

**Context7 is NOT needed for your app!**

```
What it is: Documentation search for Claude AI (me!)
Used by: Claude (the AI helping you code)
Cost: FREE
Impact on your app: ZERO - it's just a dev tool
Should you remove it? NO - it doesn't affect anything

It's in .claude/settings.json - that's for the Claude
AI assistant, not your production app!
```

---

## 📋 Your Updated API Key List

```bash
# ✅ REQUIRED - You're waiting on this
USDA_API_KEY=waiting... (from https://fdc.nal.usda.gov/api-key-signup.html)

# ✅ FREE - Highly recommended (14,400 requests/day!)
GROQ_API_KEY=get_from_groq.com (takes 30 seconds)

# ✅ NO KEY NEEDED - Weather (already implemented!)
# Open-Meteo requires no API key at all

# ❌ NOT NEEDED
OPENWEATHER_API_KEY=not_needed (we use Open-Meteo instead)
OPENAI_API_KEY=not_needed (we use Groq instead)
CONTEXT7_API_KEY=not_needed (dev tool only)
```

---

## 🎯 Total Cost

| Service              | Cost               |
| -------------------- | ------------------ |
| Weather (Open-Meteo) | **$0**             |
| AI (Groq)            | **$0**             |
| USDA Food Data       | **$0**             |
| Supabase             | **$0** (free tier) |
| **TOTAL**            | **$0/month** 🎉    |

---

## ✅ Action Items

1. ⏳ **Wait for USDA API key** (you're already doing this)
2. ✅ **Sign up for Groq** (30 seconds: https://console.groq.com/)
3. ✅ **Deploy new functions** (run commands above)
4. ✅ **Update Angular services** (optional - functions work as-is)

**Everything is now 100% FREE!** 🎉
