# Enable Leaked Password Protection

This Supabase Edge Function provides leaked password protection by checking passwords against the Have I Been Pwned database.

## Features

- ✅ Checks passwords against Have I Been Pwned API
- ✅ Uses k-anonymity model (only sends first 5 chars of SHA-1 hash)
- ✅ Secure - never sends full password to external API
- ✅ Fail-open design (allows password if API is unavailable)
- ✅ CORS enabled for frontend integration

## Usage

### Check Password

```javascript
const response = await fetch(
  'https://pvziciccwxgftcielknm.supabase.co/functions/v1/enable-leaked-password-protection',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'check',
      password: 'userPassword123',
    }),
  }
);

const result = await response.json();
// { leaked: true/false, message: "..." }
```

### Check Status

```javascript
const response = await fetch(
  'https://pvziciccwxgftcielknm.supabase.co/functions/v1/enable-leaked-password-protection',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'status',
    }),
  }
);
```

## Integration with Sign-Up/Password Change

You can integrate this into your authentication flow:

```javascript
// In your sign-up or password change handler
async function validatePassword(password) {
  const response = await fetch(
    'https://pvziciccwxgftcielknm.supabase.co/functions/v1/enable-leaked-password-protection',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'check',
        password: password,
      }),
    }
  );

  const result = await response.json();
  
  if (result.leaked) {
    throw new Error(result.message);
  }
  
  return true;
}
```

## Security Notes

- Uses k-anonymity model - only first 5 characters of SHA-1 hash are sent
- Full password never leaves your application
- Requires authentication (Bearer token)
- Fail-open design - allows password if API is unavailable (logs error)

## Deployment

Deploy using Supabase CLI:

```bash
supabase functions deploy enable-leaked-password-protection
```

## Environment Variables

The function uses these environment variables (automatically provided by Supabase):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

