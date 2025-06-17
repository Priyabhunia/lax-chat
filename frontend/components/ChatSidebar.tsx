import { useAuth } from '../providers/SupabaseAuthProvider';
import { cn } from '../../lib/utils';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  useSidebar
} from './ui/sidebar';
import { Button, buttonVariants } from './ui/button';
import { useThreads, useDeleteThread } from '../hooks/useSupabaseData';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { X, Square, ArrowLeftRight, Trash2 } from 'lucide-react';
import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';

// Memoize the entire sidebar component to prevent unnecessary re-renders
const ChatSidebar = memo(function ChatSidebar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const supabase = useSupabase();
  const { threads, isLoading, refetch } = useThreads(user?.userId || '');
  const deleteThread = useDeleteThread();
  const { isOpen, toggleSidebar, position, togglePosition } = useSidebar();
  const [deletingThreads, setDeletingThreads] = useState<string[]>([]);
  const [localThreads, setLocalThreads] = useState(threads);

  // Update local threads when threads from hook change
  useEffect(() => {
    setLocalThreads(threads);
  }, [threads]);

  // Set up real-time subscription to thread changes
  useEffect(() => {
    if (!user?.userId) return;

    // Create a unique channel ID for this component instance
    const channelId = `threads-changes-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Setting up threads subscription on channel: ${channelId}`);
    
    // Create a real-time subscription for thread changes
    const subscription = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'threads',
          filter: `user_id=eq.${user.userId}`,
        },
        (payload) => {
          console.log("Thread change detected:", payload);
          
          // Handle different events
          if (payload.eventType === 'DELETE') {
            // For DELETE, immediately update the local state
            const deletedId = payload.old?.id;
            if (deletedId) {
              setLocalThreads(prev => prev.filter(thread => thread.id !== deletedId));
              
              // If we're viewing the deleted thread, navigate away
              if (id === deletedId) {
                navigate("/chat");
              }
            }
          } else if (payload.eventType === 'INSERT') {
            // For INSERT, add the new thread to local state immediately
            if (payload.new) {
              setLocalThreads(prev => [payload.new, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // For UPDATE, update the thread in local state
            if (payload.new) {
              setLocalThreads(prev => prev.map(thread => 
                thread.id === payload.new.id ? payload.new : thread
              ));
            }
          }
          
          // Also trigger a refetch to ensure DB state consistency
          refetch();
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      console.log(`Cleaning up threads subscription on channel: ${channelId}`);
      subscription.unsubscribe();
    };
  }, [user?.userId, supabase, refetch, id, navigate]);

  // Handle thread deletion with proper state management
  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      // Add thread to deleting state
      setDeletingThreads(prev => [...prev, threadId]);
      
      // Optimistically update UI first
      setLocalThreads(prev => prev.filter(thread => thread.id !== threadId));
      
      // Then perform the actual deletion
      await deleteThread(threadId);
      
      // If we're currently viewing this thread, navigate away
      if (id === threadId) {
        navigate("/chat");
      }
      
      // Refresh the thread list
      refetch();
    } catch (error) {
      console.error("Failed to delete thread:", error);
      alert("Failed to delete thread. Please try again.");
      
      // Restore the thread in the UI if deletion failed
      refetch();
    } finally {
      // Remove thread from deleting state
      setDeletingThreads(prev => prev.filter(id => id !== threadId));
    }
  }, [id, navigate, deleteThread, refetch]);

  // Memoize the header buttons to prevent re-renders
  const headerButtons = useMemo(() => (
        <div className="flex gap-1 order-none">
          {/* Position toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex text-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePosition();
            }}
            aria-label="Toggle Sidebar Position"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex text-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSidebar();
            }}
            aria-label="Toggle Sidebar"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
  ), [togglePosition, toggleSidebar]);

  // Memoize the thread list to prevent re-renders
  const threadList = useMemo(() => {
    if (isLoading) {
      return (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
      );
    }
    
    if (localThreads.length === 0) {
      return (
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-sm text-muted-foreground">No chat threads yet</span>
            </div>
      );
    }
    
    return (
            <div className="space-y-1 py-2">
              {localThreads.map((thread) => (
                <div
                  key={thread.id}
              className={cn(
                    "flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-muted group",
                    id === thread.id && "bg-muted"
                  )}
                >
                  <Link
                    to={`/chat/${thread.id}`}
                    className="flex-1 truncate"
                    title={thread.title}
                  >
                    {thread.title || "New Chat"}
                  </Link>
              <Button
                variant="ghost"
                size="icon"
                    className="w-6 h-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this chat?")) {
                  handleDeleteThread(thread.id);
                }
              }}
              disabled={deletingThreads.includes(thread.id)}
            >
              {deletingThreads.includes(thread.id) ? (
                <span className="animate-spin w-3.5 h-3.5">⟳</span>
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
                    <span className="sr-only">Delete</span>
              </Button>
            </div>
          ))}
            </div>
    );
  }, [localThreads, isLoading, id, deletingThreads, handleDeleteThread]);

  if (!user) return null;

  // If sidebar is closed, don't render anything
  if (!isOpen) {
    return null;
  }

  // Use a simple class name without conditional rendering
  return (
    <Sidebar className="sidebar-container">
      <SidebarHeader className="border-b border-border/50 p-2 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          lax
        </h1>
        {headerButtons}
      </SidebarHeader>
      
      <SidebarContent className="p-2 flex flex-col gap-1">
        <Link
          to="/chat"
          className={buttonVariants({
            variant: 'default',
            className: 'w-full py-3 flex items-center justify-center bg-[#1a73e8] hover:bg-[#185abc] text-white rounded-md',
          })}
        >
          New Chat
        </Link>
        
        <div className="space-y-0.5 mt-2 flex-1 overflow-y-auto">
          {threadList}
        </div>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-border/50 p-2">
        <Link
          to="/settings"
          className={buttonVariants({ 
            variant: "ghost", 
            className: "w-full flex items-center justify-center text-sm"
          })}
          onClick={(e) => {
            // Prevent default behavior to ensure clean navigation
            e.stopPropagation();
          }}
        >
          Settings
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
});

export default ChatSidebar;
