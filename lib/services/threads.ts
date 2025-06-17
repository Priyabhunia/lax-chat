import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { Tables } from '../supabase';

export interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessageAt: number;
  userId: string;
}

// Get all threads for a user
export async function getThreadsByUserId(userId: string): Promise<Thread[]> {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching threads:', error);
    throw new Error(error.message);
  }

  return (data || []).map((thread: Tables['threads']) => ({
    id: thread.id,
    title: thread.title,
    createdAt: thread.created_at,
    updatedAt: thread.updated_at,
    lastMessageAt: thread.last_message_at,
    userId: thread.user_id,
  }));
}

// Get a thread by ID
export async function getThreadById(threadId: string): Promise<Thread | null> {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('id', threadId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 means no rows returned
      return null;
    }
    console.error('Error fetching thread:', error);
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastMessageAt: data.last_message_at,
    userId: data.user_id,
  };
}

// Create a new thread
export async function createThread(title: string, userId: string): Promise<Thread> {
  const now = Date.now();
  const threadId = uuidv4();

  const newThread = {
    id: threadId,
    title,
    created_at: now,
    updated_at: now,
    last_message_at: now,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('threads')
    .insert([newThread])
    .select()
    .single();

  if (error) {
    console.error('Error creating thread:', error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastMessageAt: data.last_message_at,
    userId: data.user_id,
  };
}

// Update a thread
export async function updateThread(
  threadId: string, 
  updates: { title?: string; lastMessageAt?: number }
): Promise<Thread> {
  const now = Date.now();
  
  const updateData: Partial<Tables['threads']> = {
    updated_at: now,
  };
  
  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }
  
  if (updates.lastMessageAt !== undefined) {
    updateData.last_message_at = updates.lastMessageAt;
  }

  const { data, error } = await supabase
    .from('threads')
    .update(updateData)
    .eq('id', threadId)
    .select()
    .single();

  if (error) {
    console.error('Error updating thread:', error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastMessageAt: data.last_message_at,
    userId: data.user_id,
  };
}

// Delete a thread
export async function deleteThread(threadId: string): Promise<void> {
  // First delete all messages associated with the thread
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('thread_id', threadId);

  if (messagesError) {
    console.error('Error deleting messages:', messagesError);
    throw new Error(messagesError.message);
  }

  // Then delete all message summaries associated with the thread
  const { error: summariesError } = await supabase
    .from('message_summaries')
    .delete()
    .eq('thread_id', threadId);

  if (summariesError) {
    console.error('Error deleting message summaries:', summariesError);
    throw new Error(summariesError.message);
  }

  // Finally delete the thread itself
  const { error } = await supabase
    .from('threads')
    .delete()
    .eq('id', threadId);

  if (error) {
    console.error('Error deleting thread:', error);
    throw new Error(error.message);
  }
} 