import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';
import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { v4 as uuidv4 } from 'uuid';
import { UIMessage } from 'ai';

// Hook to get messages for a thread
export function useMessages(threadId: string) {
  const { data, isLoading, error, refetch } = useSupabaseQuery(async (supabase) => {
    if (!threadId) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
    
    return data || [];
  }, [threadId], { bypassThrottle: true }); // Bypass throttle to ensure faster thread switching
  
  // Set up real-time subscriptions for messages
  const supabase = useSupabase();
  const [localMessages, setLocalMessages] = useState(data || []);
  const channelRef = useRef<any>(null);
  const instanceId = useRef(`${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  
  // Update local messages when data from hook changes
  useEffect(() => {
    setLocalMessages(data || []);
  }, [data]);
  
  // Subscribe to real-time message updates
  useEffect(() => {
    if (!threadId) return;
    
    // Unique channel name for this component instance
    const channelName = `messages-${threadId}-${instanceId.current}`;
    console.log(`Setting up message subscription for thread: ${threadId} on channel: ${channelName}`);
    
    // Clean up any existing subscription first
    if (channelRef.current) {
      console.log(`Cleaning up previous subscription: ${channelName}`);
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    // Create a new subscription for this thread's messages
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          console.log("Message change detected:", payload);
          
          if (payload.eventType === 'INSERT') {
            // For new messages, add them to local state
            if (payload.new) {
              setLocalMessages(prev => [...prev, payload.new]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // For updated messages, update the local state
            if (payload.new) {
              setLocalMessages(prev => 
                prev.map(msg => msg.id === payload.new.id ? payload.new : msg)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            // For deleted messages, remove from local state
            if (payload.old) {
              setLocalMessages(prev => 
                prev.filter(msg => msg.id !== payload.old.id)
              );
            }
          }
          
          // Also trigger a refetch to ensure DB consistency
          refetch();
        }
      )
      .subscribe();
    
    // Store channel reference for cleanup
    channelRef.current = channel;
    
    return () => {
      console.log(`Cleaning up message subscription for thread: ${threadId} on channel: ${channelName}`);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [threadId, supabase, refetch]);
  
  return {
    messages: localMessages,
    isLoading,
    error,
    refetch
  };
}

// Hook to get message summaries for a thread
export function useMessageSummaries(threadId: string) {
  const { data, isLoading, error, refetch } = useSupabaseQuery(async (supabase) => {
    const { data, error } = await supabase
      .from('message_summaries')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    return data || [];
  }, [threadId]);
  
  return {
    summaries: data || [],
    isLoading,
    error,
    refetch
  };
}

// Hook to create a message
export function useCreateMessage() {
  const { mutate } = useSupabaseMutation(async (supabase, threadId: string, message: UIMessage, userId: string) => {
    const now = Date.now();
    const messageId = message.id || uuidv4();
    
    const { error } = await supabase
      .from('messages')
      .insert([{
        id: messageId,
        thread_id: threadId,
        content: message.content || '',
        role: message.role,
        created_at: now,
        user_id: userId
      }]);
      
    if (error) throw error;
    
    // Also update the thread's lastMessageAt
    await supabase
      .from('threads')
      .update({ last_message_at: now, updated_at: now })
      .eq('id', threadId);
      
    return messageId;
  });
  
  return useCallback((threadId: string, message: UIMessage, userId: string) => {
    return mutate(threadId, message, userId);
  }, [mutate]);
}

// Hook to update a thread
export function useUpdateThread() {
  const { mutate } = useSupabaseMutation(async (supabase, threadId: string, updates: { title?: string }) => {
    const now = Date.now();
    const updateData: any = { updated_at: now };
    
    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    
    const { data, error } = await supabase
      .from('threads')
      .update(updateData)
      .eq('id', threadId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  });
  
  return useCallback((threadId: string, updates: { title?: string }) => {
    return mutate(threadId, updates);
  }, [mutate]);
}

// Hook to create a message summary
export function useCreateMessageSummary() {
  const { mutate } = useSupabaseMutation(async (supabase, threadId: string, messageId: string, content: string, userId: string) => {
    const now = Date.now();
    const summaryId = uuidv4();
    
    const { data, error } = await supabase
      .from('message_summaries')
      .insert([{
        id: summaryId,
        thread_id: threadId,
        message_id: messageId,
        content,
        created_at: now,
        user_id: userId
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  });
  
  return useCallback((threadId: string, messageId: string, content: string, userId: string) => {
    return mutate(threadId, messageId, content, userId);
  }, [mutate]);
}

// Hook to get a thread by ID
export function useThread(threadId: string) {
  const { data, isLoading, error } = useSupabaseQuery(async (supabase) => {
    if (!threadId) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .eq('id', threadId)
      .single();
      
    if (error) {
      // If the thread doesn't exist, return null instead of throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error("Error fetching thread:", error);
      throw error;
    }
    
    return data;
  }, [threadId]);
  
  return {
    thread: data,
    isLoading,
    error
  };
}

// Hook to get all threads for a user
export function useThreads(userId: string) {
  const { data, isLoading, error, refetch } = useSupabaseQuery(async (supabase) => {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }, [userId]);
  
  // Force a refetch when the component mounts or userId changes
  useEffect(() => {
    if (userId) {
      // Slight delay to ensure database has the latest data
      const timer = setTimeout(() => {
        refetch();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [userId, refetch]);
  
  return {
    threads: data || [],
    isLoading,
    error,
    refetch
  };
}

// Hook to create a thread
export function useCreateThread() {
  const { mutate } = useSupabaseMutation(async (supabase, title: string, userId: string) => {
    const now = Date.now();
    const threadId = uuidv4();
    
    // First check if the user exists in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error("User check failed:", userError);
      
      // If the user doesn't exist, create the user record
      if (userError.code === 'PGRST116') {
        // Get the user's email from auth
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("Failed to get auth user:", authError);
          throw authError;
        }
        
        if (authData && authData.user) {
          const { data: newUser, error: createUserError } = await supabase
            .from('users')
            .insert([{
              id: userId,
              email: authData.user.email || 'no-email',
              name: authData.user.user_metadata?.name || null,
              created_at: now,
              updated_at: now
            }])
            .select()
            .single();
            
          if (createUserError) {
            console.error("Failed to create user:", createUserError);
            throw createUserError;
          }
        } else {
          console.error("No auth user data available");
          throw new Error("Cannot create user record: No auth user data available");
        }
      } else {
        throw userError;
      }
    }
    
    // Now create the thread
    try {
      const { data, error } = await supabase
        .from('threads')
        .insert([{
          id: threadId,
          title,
          created_at: now,
          updated_at: now,
          last_message_at: now,
          user_id: userId
        }])
        .select()
        .single();
        
      if (error) {
        console.error("Thread creation error:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Thread creation exception:", error);
      throw error;
    }
  });
  
  return useCallback((title: string, userId: string) => {
    return mutate(title, userId);
  }, [mutate]);
}

// Hook to delete a thread
export function useDeleteThread() {
  const { mutate } = useSupabaseMutation(async (supabase, threadId: string) => {
    try {
      // First delete all messages and summaries (cascade should handle this,
      // but we're being explicit for clarity)
      const { error: summaryError } = await supabase
        .from('message_summaries')
        .delete()
        .eq('thread_id', threadId);
      
      if (summaryError) {
        console.error("Error deleting message summaries:", summaryError);
        // Continue with deletion even if this fails
      }
      
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('thread_id', threadId);
        
      if (messagesError) {
        console.error("Error deleting messages:", messagesError);
        // Continue with deletion even if this fails
      }
    
      // Then delete the thread - make sure to wait for the response
      const { error: threadError, data } = await supabase
        .from('threads')
        .delete()
        .eq('id', threadId)
        .select();
      
      if (threadError) {
        console.error("Error deleting thread:", threadError);
        throw threadError;
      }
      
      // Add a short delay to allow Supabase to propagate the deletion
      // This helps ensure real-time subscriptions see the change
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true, threadId };
    } catch (error) {
      console.error("Thread deletion failed:", error);
      throw error;
    }
  });
  
  return useCallback((threadId: string) => {
    return mutate(threadId);
  }, [mutate]);
} 