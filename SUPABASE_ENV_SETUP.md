# Supabase Environment Setup for lax

To use Supabase in your application, you need to set up the following environment variables:

1. Create a `.env.local` file in the root directory of your project
2. Add the following variables to the file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_url` and `your_supabase_anon_key` with the actual values from your Supabase project.

You can find these values in the Supabase dashboard under Project Settings > API.

## Example

```
VITE_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3BxcnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzQ0NzY0MzAsImV4cCI6MTk1MDA1MjQzMH0.EXAMPLE_KEY
```

## Repository

https://github.com/Priyabhunia/me 