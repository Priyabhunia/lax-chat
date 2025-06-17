import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with hardcoded values
// In production, these should be in environment variables
// This section contains the Supabase project URL and anon key, which are required for the app to connect to your Supabase backend.
// For open source projects, you should NOT commit your actual project keys or secrets to the repository.
// Instead, you should use environment variables and provide an example file (e.g., `.env.example`) with placeholder values.
// The code below expects these values to be injected at build time. You can safely commit this code, but do NOT commit your real keys.

// Yes, this will work fine as long as you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY defined in your .env file and you are using a build tool like Vite that injects these variables at build time.
// The TypeScript red underline is just a type-checking issue and does not affect runtime behavior.
// Your Supabase client will be initialized correctly with the values from your .env file.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase configuration values.");
}

// Create client with explicit auth settings
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth',
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    timeout: 60000, // Increase timeout to 60 seconds for better reliability
  },
});

// Verify auth silently
supabase.auth.getSession().catch(error => {
  console.error("Auth session error:", error);
});

// Type definitions for database tables
export type Tables = {
  users: {
    id: string;
    email: string;
    name?: string;
    created_at: number;
    updated_at: number;
  };
  threads: {
    id: string;
    title: string;
    created_at: number;
    updated_at: number;
    last_message_at: number;
    user_id: string;
  };
  messages: {
    id: string;
    thread_id: string;
    content: string;
    role: string;
    created_at: number;
    user_id: string;
  };
  message_summaries: {
    id: string;
    thread_id: string;
    message_id: string;
    content: string;
    created_at: number;
    user_id: string;
  };
}; 