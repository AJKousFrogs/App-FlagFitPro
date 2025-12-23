# Database Directory

This directory is reserved for database-related utilities.

## Current Database Setup

The application uses **Supabase** for all database operations:

- **Authentication**: Handled via `@supabase/supabase-js`
- **Database Queries**: Direct Supabase client calls
- **Configuration**: See `src/js/config/supabase-config.js`
- **Client Setup**: See `src/js/services/supabase-client.js`

## Using Supabase

```javascript
// Import Supabase client
import { supabase } from "../js/services/supabase-client.js";

// Example query
const { data, error } = await supabase.from("table_name").select("*");
```

For more information, see:

- `src/js/config/supabase-config.js` - Configuration
- `src/js/services/supabase-client.js` - Client setup
