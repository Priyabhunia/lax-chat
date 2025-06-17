-- Create tables for the application

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access only their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can only access their own data'
  ) THEN
    CREATE POLICY "Users can only access their own data" 
      ON public.users 
      FOR SELECT 
      USING (auth.uid() = id);
  END IF;
END
$$;

-- Create policy for users to insert their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert their own data'
  ) THEN
    CREATE POLICY "Users can insert their own data" 
      ON public.users 
      FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Threads table
CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  last_message_at BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON public.threads(user_id);

-- Enable Row Level Security
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access only their own threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'threads' AND policyname = 'Users can only access their own threads'
  ) THEN
    CREATE POLICY "Users can only access their own threads" 
      ON public.threads 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create explicit policy for users to insert their own threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'threads' AND policyname = 'Users can insert their own threads'
  ) THEN
    CREATE POLICY "Users can insert their own threads" 
      ON public.threads 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Create explicit policy for users to update their own threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'threads' AND policyname = 'Users can update their own threads'
  ) THEN
    CREATE POLICY "Users can update their own threads" 
      ON public.threads 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create explicit policy for users to delete their own threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'threads' AND policyname = 'Users can delete their own threads'
  ) THEN
    CREATE POLICY "Users can delete their own threads" 
      ON public.threads 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create index on thread_id for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select messages in their own threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can select messages in their own threads'
  ) THEN
    CREATE POLICY "Users can select messages in their own threads" 
      ON public.messages 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.threads 
          WHERE threads.id = messages.thread_id 
          AND threads.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Create policy for users to insert messages in their own threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can insert messages in their own threads'
  ) THEN
    CREATE POLICY "Users can insert messages in their own threads" 
      ON public.messages 
      FOR INSERT 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.threads 
          WHERE threads.id = messages.thread_id 
          AND threads.user_id = auth.uid()
        ) AND auth.uid() = user_id
      );
  END IF;
END
$$;

-- Message summaries table
CREATE TABLE IF NOT EXISTS public.message_summaries (
  id UUID PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create index on thread_id for faster queries
CREATE INDEX IF NOT EXISTS idx_message_summaries_thread_id ON public.message_summaries(thread_id);
-- Create index on message_id for faster queries
CREATE INDEX IF NOT EXISTS idx_message_summaries_message_id ON public.message_summaries(message_id);

-- Enable Row Level Security
ALTER TABLE public.message_summaries ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select message summaries in their own threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'message_summaries' AND policyname = 'Users can select message summaries in their own threads'
  ) THEN
    CREATE POLICY "Users can select message summaries in their own threads" 
      ON public.message_summaries 
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.threads 
          WHERE threads.id = message_summaries.thread_id 
          AND threads.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Create policy for users to insert message summaries in their own threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'message_summaries' AND policyname = 'Users can insert message summaries in their own threads'
  ) THEN
    CREATE POLICY "Users can insert message summaries in their own threads" 
      ON public.message_summaries 
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.threads 
          WHERE threads.id = message_summaries.thread_id 
          AND threads.user_id = auth.uid()
        ) AND auth.uid() = user_id
      );
  END IF;
END
$$; 