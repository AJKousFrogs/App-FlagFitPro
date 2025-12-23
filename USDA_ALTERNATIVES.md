# 🍎 USDA API Alternatives - Complete Guide

**Last Updated:** December 23, 2025  
**Status:** Multiple FREE options available

---

## 🎯 Best FREE Alternatives to USDA

### **Option 1: Edamam Nutrition API** ⭐⭐⭐ RECOMMENDED

```
✅ FREE Tier: 5,000 calls/month (166/day)
✅ Data: 900,000+ foods (USDA + branded)
✅ Quality: Excellent, verified data
✅ API: Simple REST API
✅ Signup: https://developer.edamam.com/
✅ No credit card required

Perfect for: Your app's expected usage (~50-100 calls/day)

Sample Response:
{
  "food": "chicken breast",
  "calories": 165,
  "protein": 31g,
  "carbs": 0g,
  "fat": 3.6g
}
```

### **Option 2: Nutritionix API** ⭐⭐⭐ ALSO GREAT

```
✅ FREE Tier: 200 requests/day
✅ Data: 800,000+ foods (USDA + restaurant)
✅ Quality: Very good, natural language
✅ API: REST + Natural Language Processing
✅ Signup: https://developer.nutritionix.com/
✅ No credit card required

Perfect for: Natural language food search
"I ate 2 scrambled eggs and toast" → nutritional breakdown
```

### **Option 3: Spoonacular API** ⭐⭐

```
✅ FREE Tier: 150 requests/day
✅ Data: 380,000+ foods + recipes
✅ Quality: Good, includes recipes
✅ API: REST, comprehensive
✅ Signup: https://spoonacular.com/food-api
✅ No credit card required

Perfect for: If you want recipes + nutrition
```

### **Option 4: USDA FoodData Central** ⭐

```
✅ FREE Tier: Unlimited (rate limited)
✅ Data: 600,000+ foods (most comprehensive)
✅ Quality: Excellent (official source)
✅ API: REST
✅ Signup: https://fdc.nal.usda.gov/api-key-signup.html
⏳ You're waiting for this key

Perfect for: Official data, no limits
```

---

## 📊 Detailed Comparison

| API             | Free Calls  | Foods | Quality    | Best For   | Signup Time |
| --------------- | ----------- | ----- | ---------- | ---------- | ----------- |
| **Edamam**      | 5,000/month | 900K+ | ⭐⭐⭐⭐⭐ | Most apps  | 2 min       |
| **Nutritionix** | 200/day     | 800K+ | ⭐⭐⭐⭐⭐ | NLP search | 2 min       |
| **Spoonacular** | 150/day     | 380K+ | ⭐⭐⭐⭐   | Recipes    | 2 min       |
| **USDA**        | Unlimited\* | 600K+ | ⭐⭐⭐⭐⭐ | Official   | Waiting     |

\*Rate limited to ~10 requests/second

---

## 💡 My Recommendation

**Use Edamam** because:

1. ✅ 5,000 free calls/month = 166/day (plenty for you)
2. ✅ Largest database (900K+ foods)
3. ✅ INCLUDES USDA data + branded foods
4. ✅ No waiting - instant API key
5. ✅ Better search quality than raw USDA
6. ✅ No credit card needed

**Your usage estimate:**

- 10-50 users × 2-3 searches/day = ~100 calls/day
- 100 calls/day × 30 days = 3,000/month
- **Well within 5,000 free limit!** ✅

---

## 🚀 Quick Setup - Edamam (2 minutes)

### **Step 1: Sign Up**

```
1. Go to: https://developer.edamam.com/
2. Click "Sign Up" (free)
3. Choose "Nutrition Analysis API"
4. Get instant API key + App ID
```

### **Step 2: Test It**

```bash
# Test Edamam API
curl "https://api.edamam.com/api/nutrition-data?app_id=YOUR_APP_ID&app_key=YOUR_APP_KEY&nutrition-type=logging&ingr=1%20chicken%20breast"

# Response:
{
  "calories": 165,
  "totalNutrients": {
    "ENERC_KCAL": { "label": "Energy", "quantity": 165, "unit": "kcal" },
    "PROCNT": { "label": "Protein", "quantity": 31, "unit": "g" },
    "FAT": { "label": "Fat", "quantity": 3.6, "unit": "g" }
  }
}
```

### **Step 3: Deploy Edge Function**

I'll create this for you now...

---

## 🆚 Why Edamam vs USDA?

### **Edamam Advantages:**

- ✅ No waiting for approval
- ✅ Includes branded foods (Chipotle, McDonald's, etc.)
- ✅ Better search algorithm
- ✅ Clean, consistent data format
- ✅ Natural language processing
- ✅ Recipe analysis
- ✅ Meal planning features
- ✅ 5,000 free calls/month

### **USDA Advantages:**

- ✅ Unlimited calls (rate limited)
- ✅ Most authoritative source
- ✅ More raw/unprocessed foods
- ✅ Government-maintained

### **For Your App:**

**Edamam is better** because:

1. Users want to search branded foods ("Chipotle bowl")
2. You need it working NOW (no waiting)
3. 5,000/month is plenty for your scale
4. Better search UX

---

## 💰 Cost Comparison (Beyond Free Tier)

| API             | Free Tier   | Paid Plans            | Cost per 1K |
| --------------- | ----------- | --------------------- | ----------- |
| **Edamam**      | 5K/month    | $19/month (10K calls) | $1.90       |
| **Nutritionix** | 200/day     | $99/month (unlimited) | Variable    |
| **Spoonacular** | 150/day     | $49/month (10K calls) | $4.90       |
| **USDA**        | Unlimited\* | FREE                  | $0          |

**For 5,000 calls/month:**

- Edamam: FREE ✅
- Nutritionix: ~$15/month
- Spoonacular: ~$25/month
- USDA: FREE ✅

---

## 🔄 Can You Use Multiple APIs?

**YES! Here's a smart strategy:**

1. **Primary:** Edamam (instant, 5K free)
2. **Fallback:** USDA (when you get the key)
3. **Result:** Best of both worlds!

```typescript
// Try Edamam first (fast, branded foods)
try {
  const edamamResult = await searchEdamam(query);
  if (edamamResult.foods.length > 0) return edamamResult;
} catch (error) {
  // Fallback to USDA
  return await searchUSDA(query);
}
```

---

## 🎯 What To Do Now

### **Option A: Use Edamam (RECOMMENDED)** ⭐

```
✅ Instant access (no waiting)
✅ More features than USDA
✅ 5,000 free calls/month
✅ Better for end users

Action:
1. Sign up at https://developer.edamam.com/ (2 min)
2. Get App ID + App Key
3. I'll create the Edge Function
4. Deploy and test

Time: 5 minutes total
```

### **Option B: Wait for USDA + Add Edamam Later**

```
⏳ Wait for USDA approval
⏳ Can take 1-7 days
✅ Unlimited calls
❌ No branded foods

Action:
1. Continue waiting for USDA key
2. Add Edamam later if needed
```

### **Option C: Use Both (BEST!)** ⭐⭐

```
✅ Edamam for immediate launch
✅ USDA as fallback when approved
✅ Best food coverage
✅ Maximum reliability

Action:
1. Sign up for Edamam now (2 min)
2. Deploy Edamam function
3. Add USDA when key arrives
4. Use smart fallback logic
```

---

## 📝 Sample Data Comparison

### **Searching "chicken breast":**

**Edamam:**

```json
{
  "text": "chicken breast",
  "parsed": [{
    "food": "chicken breast",
    "calories": 165,
    "protein": 31g,
    "carbs": 0g,
    "fat": 3.6g
  }]
}
```

**USDA:**

```json
{
  "foods": [{
    "description": "Chicken, broiler, breast, meat only, raw",
    "fdcId": 171477,
    "nutrients": {
      "calories": 120,
      "protein": 22.5g,
      "carbs": 0g,
      "fat": 2.6g
    }
  }]
}
```

**Both are correct!** Different preparation methods (cooked vs raw).

---

## ✅ My Recommendation

**Go with Edamam NOW:**

**Pros:**

1. ✅ Available immediately (no waiting)
2. ✅ 5,000 free calls/month (enough for you)
3. ✅ Better UX (branded foods, natural language)
4. ✅ More features (recipes, meal planning)
5. ✅ Same quality data (includes USDA)

**Cons:**

1. ❌ Limited to 5,000/month (but you won't hit this)
2. ❌ Paid plans if you scale beyond 5K

**When to use USDA instead:**

- You need unlimited calls (>10K/month)
- You only want raw/unprocessed foods
- You don't want branded foods
- You're okay waiting for approval

---

## 🚀 Next Steps

**Want me to create the Edamam Edge Function?**

Just say "yes" and provide your Edamam credentials, and I'll:

1. Create `supabase/functions/search-foods-edamam/index.ts`
2. Deploy it to Supabase
3. Test it with real data
4. Update your nutrition service

**Or want to wait for USDA?**

- Just let me know when you get the key
- I'll set it up immediately

**Or want BOTH?**

- I can set up Edamam now
- Add USDA later as fallback
- Best of both worlds!

---

**What would you like to do?** 🤔
