# Migration from Convex to Supabase

This document outlines the steps to migrate the application from Convex to Supabase.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in Supabase
3. Get your Supabase URL and anon key from the project settings

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `lib/supabase-schema.sql` into the SQL editor
3. Run the SQL script to create the necessary tables and set up Row Level Security policies

## Authentication Setup

Supabase Auth is already configured in the application. It uses email/password authentication, which is compatible with the current application's authentication system.

## Switching from Convex to Supabase

1. Install the Supabase client:

```bash
npm install @supabase/supabase-js
```

2. Replace the Convex providers with Supabase providers:

```bash
# Rename the original app.tsx
mv frontend/app.tsx frontend/app.convex.tsx

# Copy the Supabase version to app.tsx
cp frontend/app.supabase.tsx frontend/app.tsx
```

## Data Migration (Optional)

If you need to migrate existing data from Convex to Supabase, you can use the following steps:

1. Export data from Convex using the Convex dashboard or API
2. Transform the data to match the Supabase schema
3. Import the data into Supabase using the Supabase client or dashboard

## File Structure

The Supabase implementation follows a similar structure to the Convex implementation:

- `lib/supabase.ts` - Supabase client configuration
- `lib/services/` - Service functions for interacting with Supabase
  - `users.ts` - User-related operations
  - `threads.ts` - Thread-related operations
  - `messages.ts` - Message-related operations
- `frontend/providers/` - React providers for Supabase
  - `SupabaseProvider.tsx` - Provides the Supabase client to the application
  - `SupabaseAuthProvider.tsx` - Handles authentication with Supabase
- `frontend/hooks/` - Custom hooks for Supabase
  - `useSupabaseQuery.ts` - Replacement for Convex's useQuery and useMutation hooks

## Testing

After migrating to Supabase, test the following functionality:

1. User registration and login
2. Creating and viewing threads
3. Sending and receiving messages
4. Updating user profiles

## Troubleshooting

If you encounter any issues during the migration, check the following:

1. Make sure the environment variables are correctly set
2. Check the browser console for any errors
3. Verify that the database tables and policies are correctly set up in Supabase
4. Ensure that the Supabase client is correctly initialized

## Reverting to Convex

If needed, you can revert to Convex by following these steps:

1. Rename the files back:

```bash
mv frontend/app.tsx frontend/app.supabase.tsx
mv frontend/app.convex.tsx frontend/app.tsx
```

2. Make sure the Convex URL is correctly set in your environment variables 