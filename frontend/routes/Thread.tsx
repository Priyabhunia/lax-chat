import Chat from '../components/Chat';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages, useThread } from '../hooks/useSupabaseData';
import { useAuth } from '../providers/SupabaseAuthProvider';
import { UIMessage } from 'ai';
import { useEffect, useMemo, useCallback, useState } from 'react';

export default function Thread() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { messages, isLoading: messagesLoading, error: messagesError } = useMessages(id || '');
  const { thread, isLoading: threadLoading, error: threadError } = useThread(id || '');
  const navigate = useNavigate();
  const [switchingThread, setSwitchingThread] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(id);
  
  // Show immediate loading state when thread ID changes
  useEffect(() => {
    if (id !== currentThreadId) {
      setSwitchingThread(true);
      setCurrentThreadId(id);
    }
  }, [id, currentThreadId]);
  
  // Clear switching state once loading completes
  useEffect(() => {
    if (!messagesLoading && !threadLoading && switchingThread) {
      setSwitchingThread(false);
    }
  }, [messagesLoading, threadLoading, switchingThread]);
  
  // Memoize the navigation callback to prevent re-renders
  const navigateToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);
  
  // Navigation effect - only run once when loading is complete
  useEffect(() => {
    // Skip if still loading
    if (threadLoading || messagesLoading) {
      return;
    }
    
    // If thread doesn't exist after loading completes, redirect to home
    if (!threadLoading && !thread && id) {
      console.error("Thread not found, navigating home:", id);
      // Use a timeout to avoid immediate redirect which could cause loops
      const redirectTimer = setTimeout(navigateToHome, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [id, threadLoading, messagesLoading, thread, navigateToHome]);

  // Memoize UI messages to prevent unnecessary re-renders
  const uiMessages: UIMessage[] = useMemo(() => {
    return messages.map((message: any) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant',
    content: message.content,
    createdAt: new Date(message.created_at),
    parts: [{ type: 'text', text: message.content }]
  }));
  }, [messages]);

  if (!id) {
    return <div className="flex items-center justify-center h-full">Thread not found</div>;
  }

  // Show immediate loading state when switching threads
  if (switchingThread) {
    return <div className="flex items-center justify-center h-full">
      <div className="animate-pulse">Switching thread...</div>
    </div>;
  }

  if (messagesError || threadError) {
    const error = messagesError || threadError;
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500 mb-4">Error loading thread</div>
        <div className="text-sm mb-4 p-2 bg-red-50 border border-red-200 rounded max-w-md">
          {error?.message || "Unknown error"}
        </div>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={navigateToHome}
        >
          Go Home
        </button>
      </div>
    );
  }

  if (messagesLoading || threadLoading) {
    return <div className="flex items-center justify-center h-full">
      <div className="animate-pulse">Loading thread...</div>
    </div>;
  }
  
  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500 mb-4">Thread not found</div>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={navigateToHome}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <Chat
      threadId={id}
      initialMessages={uiMessages}
    />
  );
}
