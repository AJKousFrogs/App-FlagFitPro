# 5-Question Contract Compliance Mapping

**Generated:** January 2026  
**Purpose:** Document where each of the 5 questions is answered for every state change in wellness-checkin and training-log components  
**Status:** ✅ Complete

---

## The 5-Question Contract

For every state change, the UI must answer:
1. **What changed** - What specifically changed in the system
2. **Why it changed** - The reason or trigger for the change
3. **What it means** - The implications or significance
4. **Who is responsible** - Who controls or is responsible for this state
5. **What happens next** - The next action or outcome

---

## Wellness Check-in Component

**File:** `angular/src/app/features/training/daily-protocol/components/wellness-checkin.component.ts`

### State Change 1: Sleep Quality Slider Change

**Location:** Lines 111-131 (form section with slider)

**5 Questions Answered:**
- ✅ **What changed:** "Sleep quality set to [label]"
- ✅ **Why:** "Based on your input"
- ✅ **What it means:** "This affects 30% of your readiness score"
- ✅ **Who:** "You control this value"
- ✅ **What next:** "Your readiness score updates automatically below"

**Implementation:** Small text below slider with `.state-narration` class

---

### State Change 2: Sleep Hours Slider Change

**Location:** Lines 134-152 (form section with slider)

**5 Questions Answered:**
- ✅ **What changed:** "Sleep hours set to [X]h"
- ✅ **Why:** "Based on your input"
- ✅ **What it means:** "This affects 15% of your readiness score. [Contextual message about range]"
- ✅ **Who:** "You control this value"
- ✅ **What next:** "Your readiness score updates automatically below"

**Implementation:** Small text below slider with `.state-narration` class

---

### State Change 3: Energy Level Slider Change

**Location:** Lines 155-175 (form section with slider)

**5 Questions Answered:**
- ✅ **What changed:** "Energy level set to [label]"
- ✅ **Why:** "Based on your input"
- ✅ **What it means:** "This affects 25% of your readiness score"
- ✅ **Who:** "You control this value"
- ✅ **What next:** "Your readiness score updates automatically below"

**Implementation:** Small text below slider with `.state-narration` class

---

### State Change 4: Muscle Soreness Slider Change

**Location:** Lines 178-198 (form section with slider)

**5 Questions Answered:**
- ✅ **What changed:** "Muscle soreness set to [label]"
- ✅ **Why:** "Based on your input"
- ✅ **What it means:** "This affects 15% of your readiness score. [Contextual message about soreness areas]"
- ✅ **Who:** "You control this value"
- ✅ **What next:** "[Conditional: Select areas below OR score updates automatically]"

**Implementation:** Small text below slider with `.state-narration` class

---

### State Change 5: Soreness Areas Section Appears

**Location:** Lines 201-220 (conditional section)

**5 Questions Answered:**
- ✅ **What changed:** "Soreness areas section appeared"
- ✅ **Why:** "Your muscle soreness is [label] (moderate or higher)"
- ✅ **What it means:** "Tracking specific areas helps identify patterns and recovery needs"
- ✅ **Who:** "You select which areas are affected"
- ✅ **What next:** "Select all areas that feel sore. This helps your coach understand your recovery status"

**Implementation:** Small text above body area grid with `.state-narration` class

---

### State Change 6: Soreness Areas Selected

**Location:** Lines 201-220 (conditional section, nested condition)

**5 Questions Answered:**
- ✅ **What changed:** "[X] area(s) selected: [list]"
- ✅ **Why:** "You selected these areas"
- ✅ **What it means:** "This information will be saved with your check-in for coach review"
- ✅ **Who:** "You control these selections"
- ✅ **What next:** "Continue with the rest of the check-in"

**Implementation:** Small text below body area grid (conditional on selections > 0)

---

### State Change 7: Stress Level Slider Change

**Location:** Lines 223-243 (form section with slider)

**5 Questions Answered:**
- ✅ **What changed:** "Stress level set to [label]"
- ✅ **Why:** "Based on your input"
- ✅ **What it means:** "This affects 15% of your readiness score"
- ✅ **Who:** "You control this value"
- ✅ **What next:** "Your readiness score updates automatically below"

**Implementation:** Small text below slider with `.state-narration` class

---

### State Change 8: Readiness Score Updates (Preview)

**Location:** Lines 261-272 (readiness preview section)

**5 Questions Answered:**
- ✅ **What changed:** "Readiness score is [X] ([level])"
- ✅ **Why:** "Calculated from your sleep quality (30%), sleep hours (15%), energy (25%), soreness (15%), and stress (15%)"
- ✅ **What it means:** "[Recommendation message based on score]"
- ✅ **Who:** "System calculates this automatically based on your inputs"
- ✅ **What next:** "[Contextual message: Ready for training OR Consider lighter training OR Rest day recommended]. Save your check-in to record this score."

**Implementation:** Small text below preview score with `.state-narration` class

---

### State Change 9: Check-in Saved (Saving State)

**Location:** Lines 275-286 (footer template, conditional on isSaving)

**5 Questions Answered:**
- ✅ **What changed:** "Check-in is being saved"
- ✅ **Why:** "You clicked 'Save Check-in'"
- ✅ **What it means:** "Your wellness data and readiness score ([X]) are being recorded"
- ✅ **Who:** "System is processing your submission"
- ✅ **What next:** "Dialog will close automatically when saved. Your readiness score will appear on your dashboard"

**Implementation:** Div in footer template with `.save-narration` class (conditional on `isSaving()`)

---

### State Change 10: Check-in Complete (hasCheckedIn = true)

**Location:** Lines 68-98 (checkin-complete display)

**5 Questions Answered:**
- ✅ **What changed:** "Check-in completed. Readiness score: [X]"
- ✅ **Why:** "You saved your wellness check-in"
- ✅ **What it means:** "[Recommendation message]"
- ✅ **Who:** "Your data is saved and visible to your coach"
- ✅ **What next:** "Click to edit or view details. This score affects your training recommendations"

**Implementation:** Small text below wellness summary with `.state-narration-inline` class

---

## Training Log Component

**File:** `angular/src/app/features/training/training-log/training-log.component.ts`

### State Change 1: Session Type Selected

**Location:** Lines 96-112 (session type card selection)

**5 Questions Answered:**
- ✅ **What changed:** "Session type set to [type]"
- ✅ **Why:** "You selected this session type"
- ✅ **What it means:** "This determines how your training load is categorized for ACWR calculations"
- ✅ **Who:** "You control this selection"
- ✅ **What next:** "Continue filling out duration, RPE, and other details below"

**Implementation:** Small text below session types grid with `.state-narration` class (conditional on selection)

---

### State Change 2: Duration Input Changed

**Location:** Lines 132-142 (duration input field)

**5 Questions Answered:**
- ✅ **What changed:** "Duration set to [X] minutes"
- ✅ **Why:** "Based on your input"
- ✅ **What it means:** "Duration is multiplied by RPE to calculate training load ([X] AU)"
- ✅ **Who:** "You control this value"
- ✅ **What next:** "Training load updates automatically below as you change duration or RPE"

**Implementation:** Small text below duration input with `.state-narration` class (conditional on value)

---

### State Change 3: RPE Slider Changed

**Location:** Lines 144-165 (RPE slider field)

**5 Questions Answered:**
- ✅ **What changed:** "RPE set to [X]/10 ([description])"
- ✅ **Why:** "Based on your input"
- ✅ **What it means:** "RPE measures perceived exertion. It's multiplied by duration to calculate training load ([X] AU), which affects your ACWR"
- ✅ **Who:** "You control this value"
- ✅ **What next:** "Training load updates automatically below. This load will be added to your ACWR calculations"

**Implementation:** Small text below RPE scale with `.state-narration` class (conditional on value)

---

### State Change 4: Calculated Load Updates

**Location:** Lines 169-177 (calculated load display)

**5 Questions Answered:**
- ✅ **What changed:** "Training load calculated as [X] AU"
- ✅ **Why:** "System automatically calculates: Duration ([X] min) × RPE ([X]) = [X] AU"
- ✅ **What it means:** "This load will be added to your 7-day acute workload for ACWR calculations. [Contextual message about load level]"
- ✅ **Who:** "System calculates this automatically from your inputs"
- ✅ **What next:** "[Conditional: See timing notice below OR When you submit, this load will update your ACWR ratio]"

**Implementation:** Small text below load formula with `.state-narration` class

---

### State Change 5: Late Log Warning Appears (Retroactive)

**Location:** Lines 255-292 (late log notice, retroactive branch)

**5 Questions Answered:**
- ✅ **What changed:** "Logging [X] hours after session completion"
- ✅ **Why:** "You're entering this session retroactively (more than 24 hours late)"
- ✅ **What it means:** "ACWR will change from [before] to approximately [after] after approval. Retroactive logs require coach review for accuracy"
- ✅ **Who:** "Your coach will review and approve this entry"
- ✅ **What next:** "Coach has been notified. You'll be notified when approved. ACWR updates after approval"

**Implementation:** Small text below ACWR impact section with `.state-narration` class

---

### State Change 6: Late Log Warning Appears (Late)

**Location:** Lines 293-320 (late log notice, late branch)

**5 Questions Answered:**
- ✅ **What changed:** "Logging [X] hours after session completion"
- ✅ **Why:** "You're entering this session late (within 24 hours but after completion)"
- ✅ **What it means:** "ACWR will update automatically from [before] to approximately [after]. No coach approval needed"
- ✅ **Who:** "System will update ACWR automatically when you submit"
- ✅ **What next:** "Submit your log to update ACWR immediately"

**Implementation:** Small text below ACWR impact section with `.state-narration` class

---

### State Change 7: Conflict Warning Appears

**Location:** Lines 326-347 (conflict warning card)

**5 Questions Answered:**
- ✅ **What changed:** "Conflict detected between your RPE input and expected session type intensity"
- ✅ **Why:** "Your RPE ([X]) doesn't match the typical intensity for this session type ([Y])"
- ✅ **What it means:** "This may indicate the session was harder/easier than expected, or there's a data entry issue. Your log will still be saved"
- ✅ **Who:** "System detected this automatically. You can adjust RPE if needed, or proceed as-is"
- ✅ **What next:** "Review your RPE value. If correct, proceed with submission. Coach may follow up if needed"

**Implementation:** Small text below conflict messages with `.state-narration` class

---

### State Change 8: Form Submission (Saving State)

**Location:** Lines 350-357 (submit button area, conditional on isSubmitting)

**5 Questions Answered:**
- ✅ **What changed:** "Session is being saved"
- ✅ **Why:** "You clicked 'Log Session'"
- ✅ **What it means:** "Your training session ([type], [X] AU load) is being recorded"
- ✅ **Who:** "System is processing your submission[. Coach will review for approval if retroactive]"
- ✅ **What next:** "[Conditional: Redirect + coach review OR Redirect + immediate ACWR update]"

**Implementation:** Div below submit button with `.submit-narration` class (conditional on `isSubmitting()`)

---

## Summary

### Wellness Check-in Component
- **Total State Changes:** 10
- **All 5 Questions Answered:** ✅ 10/10 (100%)
- **Implementation Method:** Inline small text with `.state-narration` or `.state-narration-inline` classes

### Training Log Component
- **Total State Changes:** 8
- **All 5 Questions Answered:** ✅ 8/8 (100%)
- **Implementation Method:** Inline small text with `.state-narration` class

### Overall Compliance
- **Total State Changes:** 18
- **Fully Compliant:** ✅ 18/18 (100%)
- **Status:** ✅ **COMPLETE**

---

## Design Notes

1. **No Layout Changes:** All narration is added as small text below existing UI elements
2. **Consistent Styling:** Uses `.state-narration` class with consistent styling (background, border-left, padding)
3. **Contextual Messages:** Messages adapt based on current values (e.g., sleep hours range, load level)
4. **Conditional Display:** Narration only appears when relevant (e.g., when value is set, when section appears)
5. **Accessibility:** Uses semantic HTML (`<small>`) with proper styling for readability

---

## Related Documentation

- **Phase 2 Audit:** `docs/PHASE_2_FUNCTIONALITY_TO_UX_AUDIT.md` - Original 5-Question Contract definition
- **Phase 5 Validation:** `docs/PHASE_5_CROSS_AXIS_VALIDATION.md` - Cross-axis validation identifying gaps
- **Component Files:**
  - `angular/src/app/features/training/daily-protocol/components/wellness-checkin.component.ts`
  - `angular/src/app/features/training/training-log/training-log.component.ts`

