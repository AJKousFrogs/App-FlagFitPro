# Wireframe: Settings

**Route:** `/settings`  
**Users:** All Users  
**Status:** ✅ Implemented  
**Source:** `angular/src/app/features/settings/settings.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ⚙️ Settings                                              ┌──────────────────┐│  │
│  │  Manage your account and application preferences          │ 💾 Save Changes  ││  │
│  │                                                           └──────────────────┘│  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ 👤 Profile Settings               │  │ 🔔 Notification Settings               │  │
│  │ ──────────────────────────────────│  │ ──────────────────────────────────────│  │
│  │                                    │  │                                        │  │
│  │  Display Name                      │  │  ┌──────┐                              │  │
│  │  ┌──────────────────────────────┐ │  │  │  ✉   │ Email Notifications   [ON ] │  │
│  │  │ John Smith                   │ │  │  └──────┘ Receive updates via email    │  │
│  │  └──────────────────────────────┘ │  │                                        │  │
│  │                                    │  │  ┌──────┐                              │  │
│  │  Email                             │  │  │  📱  │ Push Notifications    [ON ] │  │
│  │  ┌──────────────────────────────┐ │  │  └──────┘ Instant alerts on device     │  │
│  │  │ john@email.com               │ │  │                                        │  │
│  │  └──────────────────────────────┘ │  │  ┌──────┐                              │  │
│  │                                    │  │  │  ⏰  │ Training Reminders   [ON ] │  │
│  │  Position           Jersey #       │  │  └──────┘ Daily workout reminders      │  │
│  │  ┌──────────────┐  ┌────────────┐ │  │                                        │  │
│  │  │ Wide Receiver│  │ #55        │ │  │                                        │  │
│  │  └──────────────┘  └────────────┘ │  │                                        │  │
│  │                                    │  │                                        │  │
│  │  Team Name                         │  │                                        │  │
│  │  ┌──────────────────────────────┐ │  │                                        │  │
│  │  │ Ljubljana Eagles             │ │  │                                        │  │
│  │  └──────────────────────────────┘ │  │                                        │  │
│  │                                    │  │                                        │  │
│  │  Phone Number                      │  │                                        │  │
│  │  ┌──────────────────────────────┐ │  │                                        │  │
│  │  │ +1 555-123-4567              │ │  │                                        │  │
│  │  └──────────────────────────────┘ │  │                                        │  │
│  │                                    │  │                                        │  │
│  └────────────────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ 🔒 Privacy Settings               │  │ 🎨 App Preferences                     │  │
│  │ ──────────────────────────────────│  │ ──────────────────────────────────────│  │
│  │                                    │  │                                        │  │
│  │  Profile Visibility                │  │  Theme                                 │  │
│  │  ┌──────────────────────────────┐ │  │  ┌────────┐ ┌────────┐ ┌────────┐     │  │
│  │  │ Public              ▼        │ │  │  │  ☀️   │ │  🌙   │ │  🖥️   │     │  │
│  │  │ Everyone can see             │ │  │  │ Light  │ │ Dark   │ │ Auto   │     │  │
│  │  └──────────────────────────────┘ │  │  └────────┘ └────────┘ └────────┘     │  │
│  │                                    │  │                         ↑ active      │  │
│  │  Show Statistics Publicly          │  │                                        │  │
│  │                           [ON ]    │  │  Follows your system preference        │  │
│  │                                    │  │                                        │  │
│  │  ─────────────────────────────────│  │  Language                               │  │
│  │                                    │  │  ┌──────────────────────────────┐     │  │
│  │  Advanced Privacy Controls         │  │  │ 🇬🇧 English                  ▼│     │  │
│  │  Manage AI processing, team data.. │  │  └──────────────────────────────┘     │  │
│  │                                    │  │                                        │  │
│  │  ┌───────────────────────────────┐│  │  ℹ️ Translation coming soon - your     │  │
│  │  │ 🛡️ Privacy Controls           ││  │     preference will be saved           │  │
│  │  └───────────────────────────────┘│  │                                        │  │
│  │                                    │  │                                        │  │
│  └────────────────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🛡️ Security                                                                   │  │
│  │ ────────────────────────────────────────────────────────────────────────────  │  │
│  │                                                                                │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ Change Password                                        ┌────────────┐  │   │  │
│  │  │ Update your account password                           │  🔑 Change │  │   │  │
│  │  └────────────────────────────────────────────────────────┴────────────┴──┘   │  │
│  │  ───────────────────────────────────────────────────────────────────────────  │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ Two-Factor Authentication (2FA)                        ┌────────────┐  │   │  │
│  │  │ Add an extra layer of security                         │ 🛡️ Enable │  │   │  │
│  │  └────────────────────────────────────────────────────────┴────────────┴──┘   │  │
│  │  ───────────────────────────────────────────────────────────────────────────  │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ Active Sessions                                        ┌────────────┐  │   │  │
│  │  │ Manage your logged-in devices                          │ 🖥️ View   │  │   │  │
│  │  └────────────────────────────────────────────────────────┴────────────┴──┘   │  │
│  │  ───────────────────────────────────────────────────────────────────────────  │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ Delete Account                                         ┌────────────┐  │   │  │
│  │  │ Permanently delete your account and all data           │ 🗑️ Delete │  │   │  │
│  │  └────────────────────────────────────────────────────────┴────────────┴──┘   │  │
│  │                                                              ↑ Red/Danger      │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Change Password Dialog

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                    [✕] │
│  │  🔒  │  Change Password                                       │
│  └──────┘  Update your account password                          │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  🔑 Current Password                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ••••••••••••                                      👁️     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  🛡️ New Password                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ••••••••                                          👁️     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Password Requirements:                                          │
│  ✓ At least 8 characters                                         │
│  ✓ One uppercase letter                                          │
│  ○ One number                                                    │
│  ○ One special character                                         │
│                                                                  │
│  ✅ Confirm New Password                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ••••••••                                          👁️     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ✓ Passwords match                                               │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│                           [Cancel]  [Update Password]            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2FA Setup Dialog (4 Steps)

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                    [✕] │
│  │  🛡️  │  Two-Factor Authentication                            │
│  └──────┘  Step 2 of 4 — Add extra security                      │
│                                                                  │
│            ○───●───○───○                                         │
│            1   2   3   4                                         │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  STEP 1: Install an Authenticator App                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │ │
│  │  │  Google  │  │Microsoft │  │  Authy   │                  │ │
│  │  │   Auth   │  │   Auth   │  │          │                  │ │
│  │  └──────────┘  └──────────┘  └──────────┘                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  STEP 2: Scan QR Code                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ┌──────────────┐                        │ │
│  │                    │              │                        │ │
│  │                    │   QR CODE    │                        │ │
│  │                    │              │                        │ │
│  │                    └──────────────┘                        │ │
│  │                                                            │ │
│  │  Can't scan? Enter manually:                               │ │
│  │  ┌──────────────────────────────────────────────┐  [📋]   │ │
│  │  │ ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567      │         │ │
│  │  └──────────────────────────────────────────────┘         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  STEP 3: Verify Setup                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Enter the 6-digit code from your app:                     │ │
│  │                                                            │ │
│  │         ┌──────────────────────────┐                       │ │
│  │         │      _ _ _ _ _ _         │                       │ │
│  │         └──────────────────────────┘                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  STEP 4: Success + Backup Codes                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           ┌─────┐                                          │ │
│  │           │  ✓  │  2FA Enabled!                            │ │
│  │           └─────┘                                          │ │
│  │                                                            │ │
│  │  🔑 Backup Codes                                           │ │
│  │  Save these codes securely:                                │ │
│  │                                                            │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │ │
│  │  │ABCD-EFGH│ │IJKL-MNOP│ │QRST-UVWX│ │YZ23-4567│ │ABCD-EFGH│ │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │ │
│  │  │IJKL-MNOP│ │QRST-UVWX│ │YZ23-4567│ │ABCD-EFGH│ │IJKL-MNOP│ │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │ │
│  │                                                            │ │
│  │           ┌──────────────────────┐                         │ │
│  │           │ ⬇ Download Codes     │                         │ │
│  │           └──────────────────────┘                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│                    [Cancel]  [I have an app →]                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Delete Account Dialog

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                    [✕] │
│  │  🗑️  │  Delete Account                                       │
│  └──────┘  This action is permanent and irreversible             │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           ⚠️                                               │ │
│  │                                                            │ │
│  │  Are you absolutely sure?                                  │ │
│  │                                                            │ │
│  │  All your data will be permanently deleted:                │ │
│  │                                                            │ │
│  │  📈 Training history & progress                            │ │
│  │  📊 Performance metrics & analytics                        │ │
│  │  ⚙️ Settings & preferences                                 │ │
│  │  👤 Profile information                                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Type DELETE to confirm                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│                    [Cancel]  [🗑️ Delete My Account]             │
│                                       ↑ Danger/Red                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Page Header ✅

| Element               | Status | Notes                                             |
| --------------------- | ------ | ------------------------------------------------- |
| Title "Settings"      | ✅     | With cog icon                                     |
| Subtitle              | ✅     | "Manage your account and application preferences" |
| "Save Changes" button | ✅     | Triggers save action                              |

---

### 2. Profile Settings Card ✅

| Field         | Type            | Validation             | Status |
| ------------- | --------------- | ---------------------- | ------ |
| Display Name  | Text input      | Required               | ✅     |
| Email         | Text input      | Required, Email format | ✅     |
| Position      | Select dropdown | 15 options             | ✅     |
| Jersey Number | Text input      | Max 3 chars            | ✅     |
| Team Name     | Text input      | Optional               | ✅     |
| Phone Number  | Text input      | Optional               | ✅     |

**Position Options:**

- QB, Center, WR, RB, DB, Safety, LB, Rusher (Players)
- Coach, Manager, Physiotherapist, Nutritionist, Sport Psychologist (Staff)
- Admin, Superadmin (Admin)

---

### 3. Notification Settings Card ✅

| Setting             | Icon | Description               | Status |
| ------------------- | ---- | ------------------------- | ------ |
| Email Notifications | ✉️   | Receive updates via email | ✅     |
| Push Notifications  | 📱   | Instant alerts on device  | ✅     |
| Training Reminders  | ⏰   | Daily workout reminders   | ✅     |

All use toggle switches with ON/OFF labels.

---

### 4. Privacy Settings Card ✅

| Setting               | Type   | Options                         | Status |
| --------------------- | ------ | ------------------------------- | ------ |
| Profile Visibility    | Select | Public / Private / Coaches Only | ✅     |
| Show Statistics       | Toggle | ON/OFF                          | ✅     |
| Advanced Privacy Link | Button | Links to `/settings/privacy`    | ✅     |

**Visibility Options:**

- Public: "Everyone in the app can see"
- Private: "Only you can see"
- Coaches Only: "Only you and coaches can see"

---

### 5. App Preferences Card ✅

| Setting  | Type         | Options             | Status |
| -------- | ------------ | ------------------- | ------ |
| Theme    | Button group | Light / Dark / Auto | ✅     |
| Language | Select       | 10 languages        | ✅     |

**Theme Options:**

- Light (☀️)
- Dark (🌙)
- Auto (🖥️) - Follows system

**Language Options:**

- 🇬🇧 English, 🇪🇸 Spanish, 🇫🇷 French, 🇮🇹 Italian, 🇩🇪 German
- 🇵🇹 Portuguese, 🇵🇱 Polish, 🇸🇮 Slovenian, 🇷🇸 Serbian, 🇩🇰 Danish

---

### 6. Security Card ✅

| Action          | Button          | Dialog               | Status |
| --------------- | --------------- | -------------------- | ------ |
| Change Password | Change          | Password dialog      | ✅     |
| Two-Factor Auth | Enable/Disable  | 2FA setup wizard     | ✅     |
| Active Sessions | View            | Sessions list dialog | ✅     |
| Delete Account  | Delete (danger) | Confirmation dialog  | ✅     |

---

### 7. Dialogs ✅

#### Change Password Dialog

| Element                | Status | Notes                    |
| ---------------------- | ------ | ------------------------ |
| Current password field | ✅     | With toggle visibility   |
| New password field     | ✅     | With toggle visibility   |
| Confirm password field | ✅     | With toggle visibility   |
| Password requirements  | ✅     | 4 checklist items        |
| Match indicator        | ✅     | Green success message    |
| Cancel/Update buttons  | ✅     | Update has loading state |

**Password Requirements:**

- At least 8 characters
- One uppercase letter
- One number
- One special character (@$!%\*?&)

#### 2FA Setup Dialog

| Step   | Content                           | Status |
| ------ | --------------------------------- | ------ |
| Step 1 | Install authenticator app options | ✅     |
| Step 2 | QR code + manual secret           | ✅     |
| Step 3 | 6-digit verification input        | ✅     |
| Step 4 | Success + backup codes            | ✅     |

**Features:**

- Step progress indicators
- QR code generation
- Copy secret to clipboard
- Download backup codes as .txt

#### Delete Account Dialog

| Element                    | Status | Notes                      |
| -------------------------- | ------ | -------------------------- |
| Warning icon + message     | ✅     | Lists what will be deleted |
| Type "DELETE" confirmation | ✅     | Must match exactly         |
| Cancel/Delete buttons      | ✅     | Delete is red/danger       |

#### Active Sessions Dialog

| Element                   | Status | Notes                             |
| ------------------------- | ------ | --------------------------------- |
| Sessions list             | ✅     | Device icon, name, location, time |
| "This device" indicator   | ✅     | For current session               |
| Revoke individual session | ✅     | Button per non-current session    |
| "Sign out all others"     | ✅     | Bulk action with loading          |

---

## Business Logic

### Password Validation (Implemented)

```typescript
// Password pattern
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Validation helpers
hasUppercase(): boolean { return /[A-Z]/.test(password); }
hasNumber(): boolean { return /\d/.test(password); }
hasSpecialChar(): boolean { return /[@$!%*?&]/.test(password); }
passwordsMatch(): boolean { return newPassword === confirmPassword; }
```

### 2FA Setup (Implemented)

```typescript
// 4-step flow:
// Step 1: Show authenticator app options
// Step 2: Generate TOTP secret + QR code
// Step 3: Verify 6-digit code
// Step 4: Display backup codes

// Secret generation
generateRandomSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  // 32 character Base32 secret
}

// Backup codes
generateBackupCodes(): string[] {
  // 10 codes in XXXX-XXXX format
}
```

### Theme Application (Implemented)

```typescript
// Theme changes applied immediately via ThemeService
preferencesForm.get("theme")?.valueChanges.subscribe((theme) => {
  this.themeService.setMode(theme);
});
```

### Settings Persistence (Implemented)

```typescript
// Save to multiple locations for redundancy:
1. localStorage (fallback)
2. Supabase 'users' table (profile data)
3. Supabase 'user_settings' table (preferences)
4. Supabase auth user metadata (display name)
```

---

## Data Sources

| Data             | Service           | Storage               |
| ---------------- | ----------------- | --------------------- |
| User profile     | `AuthService`     | `getUser()`           |
| Extended profile | `SupabaseService` | `users` table         |
| Theme            | `ThemeService`    | localStorage + signal |
| Settings         | `SupabaseService` | `user_settings` table |
| 2FA status       | `SupabaseService` | `user_security` table |
| Sessions         | `SupabaseService` | Supabase auth         |

---

## Navigation Paths

| From     | To               | Trigger                    |
| -------- | ---------------- | -------------------------- |
| Settings | Privacy Controls | "Privacy Controls" button  |
| Settings | (Dialog)         | Any security action button |

---

## Feature Comparison: Documented vs Implemented

| Documented Feature          | Status | Notes                                      |
| --------------------------- | ------ | ------------------------------------------ |
| Name display                | ✅     | Editable                                   |
| Email (read-only)           | ⚠️     | Editable, but change requires verification |
| Phone number                | ✅     |                                            |
| Date of birth               | ❌     | Not in current form                        |
| Position preferences        | ✅     | Dropdown                                   |
| Training reminders          | ✅     | Toggle                                     |
| Wellness check-in reminders | ⚠️     | Part of training reminders                 |
| Team announcements          | ⚠️     | Not separate toggle                        |
| Game reminders              | ⚠️     | Not separate toggle                        |
| Achievement notifications   | ⚠️     | Not separate toggle                        |
| Push notification toggle    | ✅     |                                            |
| Profile visibility          | ✅     | 3 options                                  |
| Stats visibility            | ✅     | Toggle                                     |
| Activity visibility         | ⚠️     | Part of profile visibility                 |
| Data export request         | ❌     | Not in current UI                          |
| Theme selection             | ✅     | 3 options                                  |
| Language selection          | ✅     | 10 languages                               |
| Change password             | ✅     | Full dialog with validation                |
| 2FA setup                   | ✅     | Full 4-step wizard                         |
| Session management          | ✅     | View, revoke individual, revoke all        |
| Account deletion            | ✅     | Confirmation dialog                        |

---

## UX Notes

### ✅ What Works Well

- Clear card-based organization
- Theme selector with visual button group
- Language selector with flags and native names
- Password requirements checklist is helpful
- 2FA setup wizard is comprehensive
- Dangerous actions (delete) have proper confirmation

### ⚠️ Friction Points

- Many notification types documented but only 3 toggles implemented
- No data export option visible
- Date of birth field missing
- Language translation not actually functional (hint shown)

### 🔧 Suggested Improvements

1. Add more granular notification controls
2. Add data export/download feature
3. Add date of birth field
4. Consider collapsible sections on mobile
5. Add "Settings saved" confirmation banner
6. Add undo option after save

---

## Related Pages

| Page             | Route               | Relationship     |
| ---------------- | ------------------- | ---------------- |
| Profile          | `/profile`          | View profile     |
| Privacy Controls | `/settings/privacy` | Advanced privacy |

---

## Implementation Checklist

- [x] Page header with save button
- [x] Profile settings card
- [x] Display name input
- [x] Email input
- [x] Position select
- [x] Jersey number input
- [x] Team name input
- [x] Phone number input
- [x] Notification settings card
- [x] Email notifications toggle
- [x] Push notifications toggle
- [x] Training reminders toggle
- [x] Privacy settings card
- [x] Profile visibility select
- [x] Show stats toggle
- [x] Advanced privacy link
- [x] App preferences card
- [x] Theme button group
- [x] Language select with flags
- [x] Security card
- [x] Change password dialog
- [x] Password requirements checklist
- [x] 2FA setup wizard (4 steps)
- [x] 2FA QR code generation
- [x] 2FA backup codes
- [x] Disable 2FA dialog
- [x] Active sessions dialog
- [x] Revoke session actions
- [x] Delete account dialog
- [x] DELETE confirmation
- [x] Settings save to localStorage
- [x] Settings save to Supabase
- [ ] Date of birth field
- [ ] Data export feature
- [ ] More notification toggles
