import APIKeyManager from '../components/APIKeyForm';
import { useAPIKeyStore } from '../stores/APIKeyStore';
import { useAuth } from '../providers/SupabaseAuthProvider';
import { useCreateThread, useThreads } from '../hooks/useSupabaseData';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../providers/SupabaseProvider';

// Define status type to fix linter errors
type StatusType = 'idle' | 'loading' | 'error' | 'success';

export default function Home() {
  const { hasRequiredKeys, setKeys } = useAPIKeyStore();
  const { user, isLoading: isAuthLoading } = useAuth();
  const createThread = useCreateThread();
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusType>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const supabase = useSupabase();
  const threadCreationAttempted = useRef(false);
  
  // Get threads for refreshing the sidebar
  const { refetch: refetchThreads } = useThreads(user?.userId || '');

  // For testing purposes, set a default API key if none exists
  useEffect(() => {
    if (!hasRequiredKeys()) {
      // Set a placeholder key - this is just for development/testing
      setKeys({ google: 'TEST_KEY_FOR_DEVELOPMENT' });
    }
  }, []);

  // One-time attempt to create thread when component mounts
  useEffect(() => {
    // Only run once when component mounts and user is available
    // Use ref to ensure we only attempt thread creation once
    if (threadCreationAttempted.current || !user || isAuthLoading || status !== 'idle' || !hasRequiredKeys()) {
      return;
    }
    
    threadCreationAttempted.current = true;
    
    const initializeThread = async () => {
      // Double check the auth session is valid
      try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth session check failed:", error);
        setErrorMessage(`Auth error: ${error.message}`);
        setStatus('error');
        return;
      }
      
      if (!data?.session) {
        setErrorMessage("No active session. Please login again.");
        setStatus('error');
        return;
      }
      
      // We have a valid session, try to create a thread
        createNewThread();
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    };
    
    initializeThread();
  }, [user, isAuthLoading]); // Only depend on user and auth loading state

  // Memoize the thread creation function
  const createNewThread = useCallback(async () => {
    if (!user) {
      console.error("Cannot create thread - no user");
      return;
    }
    
    // Prevent duplicate creation attempts
    if (status !== 'idle') {
      return;
    }
    
    try {
      setStatus('loading');
      
      // Double check the auth session is valid before creating thread
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session check failed:", sessionError);
        setErrorMessage(`Session error: ${sessionError.message}`);
        setStatus('error');
        return;
      }
      
      if (!sessionData?.session) {
        console.error("No active session found");
        setErrorMessage("No active session. Please login again.");
        setStatus('error');
        return;
      }
      
      // Set a timeout to prevent hanging in the loading state
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          console.error("Thread creation timed out");
          reject(new Error("Thread creation timed out. Please try again."));
        }, 10000); // 10 second timeout
      });
      
      try {
        // Race between thread creation and timeout
        const thread = await Promise.race([
          createThread("New Chat", user.userId),
          timeoutPromise
        ]) as any; // Cast to any since the types don't match perfectly
      
        if (thread && thread.id) {
          setStatus('success');
          
          // Explicitly trigger a thread list refresh after successful thread creation
          refetchThreads();
          
          // Add a small delay to ensure the thread is available before navigation
          setTimeout(() => {
            navigate(`/chat/${thread.id}`);
          }, 100);
        } else {
          console.error("Thread creation returned invalid data:", thread);
          setErrorMessage("Thread creation failed: No thread data returned");
          setStatus('error');
        }
      } catch (threadError: any) {
        console.error("Thread creation error:", threadError);
        setErrorMessage(`Error creating thread: ${threadError.message || "Unknown error"}`);
        setStatus('error');
      }
    } catch (error: any) {
      console.error("Failed to create thread:", error);
      setErrorMessage(`Error creating thread: ${error.message || "Unknown error"}`);
      setStatus('error');
    }
  }, [user, status, supabase, createThread, navigate, refetchThreads]);

  // Show loading when auth is initializing
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!hasRequiredKeys()) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl pt-10 pb-44 mx-auto">
        <APIKeyManager />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500 mb-4">Please log in to continue</div>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => navigate('/login')}
        >
          Log In
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500 mb-4">Error creating chat</div>
        {errorMessage && (
          <div className="text-sm mb-4 p-2 bg-red-50 border border-red-200 rounded max-w-md">
            {errorMessage}
          </div>
        )}
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            setStatus('idle');
            setErrorMessage('');
            threadCreationAttempted.current = false;
            createNewThread();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse">Creating new chat...</div>
    </div>
  );
}
