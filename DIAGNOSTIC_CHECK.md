# 🔍 Diagnostic Check - What's Actually Broken?

Run these checks to see what's failing:

## 1. Check Localhost (2 min)

```bash
# Is server running?
npm start

# Open browser → http://localhost:4200
# Open DevTools (F12) → Console tab
# What errors do you see?
```

**Common Issues:**

- ❌ "Cannot find module" → Missing dependency
- ❌ "Type error" → TypeScript error
- ❌ "404" in Network tab → Missing file
- ❌ Blank page → Check console errors

---

## 2. Check CI Pipeline (5 min)

```bash
# Run locally what CI runs:
npm run lint
npm run build:production
npm run test:unit
```

**What fails?**

- Lint → Run `npm run lint:fix`
- Build → Check TypeScript errors
- Tests → Temporarily skip broken tests

---

## 3. Check Netlify Build (5 min)

```bash
# Test build locally:
cd angular
npm ci
npm run build
```

**If build fails:**

- Check error message
- Fix TypeScript errors
- Fix missing dependencies

**If build succeeds:**

- Check Netlify dashboard → Build logs
- Check environment variables
- Check Node version (should be 22)

---

## 4. Check What's Visible (10 min)

**Open ONE page in browser:**

1. Dashboard or Today page
2. Open DevTools (F12)
3. Inspect a button
4. Check Styles pane:
   - Is text color white?
   - Is background green (#089949)?
   - Are there crossed-out rules?

**If button text is black:**

- CSS override issue
- Check specificity
- Add `!important` temporarily

---

## 5. Quick Visual Check

**Check these visually:**

- [ ] Buttons have white text on green
- [ ] Cards have consistent padding
- [ ] Inputs are same height
- [ ] Dialogs are same width
- [ ] Spacing looks consistent

**If ANY are wrong:**

- That's what to fix first
- Use DevTools to find the CSS
- Fix it → See change → Commit

---

## 🎯 Priority Order

1. **Localhost working** → Can see changes
2. **CI passing** → Can deploy
3. **Netlify deploying** → Can show others
4. **ONE page looking good** → Have something to show

**Fix in this order. Don't skip steps.**
