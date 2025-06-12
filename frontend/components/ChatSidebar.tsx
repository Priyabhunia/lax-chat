import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  useSidebar
} from '@/frontend/components/ui/sidebar';
import { Button, buttonVariants } from './ui/button';
import { useThreads, useDeleteThread } from '@/frontend/hooks/useConvexData';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { X, Square, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';
import { useAuth } from '../providers/ConvexAuthProvider';

function ChatSidebar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const threads = useThreads(user?.userId);
  const deleteThread = useDeleteThread();
  const { isOpen, toggleSidebar, position, togglePosition } = useSidebar();

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
          Chat<span className="text-blue-500">0</span>
        </h1>
        {/* Use a fixed order for the buttons container */}
        <div className="flex gap-1 order-none">
          {/* Position toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex"
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
            className="h-6 w-6 flex"
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
      </SidebarHeader>
      
      <SidebarContent className="p-2 flex flex-col gap-1">
        <Link
          to="/chat"
          className={buttonVariants({
            variant: 'default',
            className: 'w-full py-3 flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-md',
          })}
        >
          New Chat
        </Link>
        
        <div className="space-y-0.5 mt-2 flex-1 overflow-y-auto">
          {threads?.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No conversations yet
            </div>
          )}
          
          {threads?.map((thread) => (
            <div
              key={thread._id}
              className={cn(
                'cursor-pointer group/thread flex items-center px-3 py-2 rounded-md w-full transition-colors',
                id === thread._id ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
              onClick={() => {
                if (id === thread._id) return;
                navigate(`/chat/${thread._id}`);
              }}
            >
              <span className="truncate block text-sm flex-1">{thread.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover/thread:opacity-100 h-6 w-6 transition-opacity"
                onClick={async (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  try {
                    await deleteThread(thread._id);
                    // Only navigate if we're currently viewing the deleted thread
                    if (id === thread._id) {
                      navigate(`/chat`);
                    }
                  } catch (error) {
                    console.error("Failed to delete thread:", error);
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-border/50 p-2">
        <Link
          to="/settings"
          className={buttonVariants({ 
            variant: "ghost", 
            className: "w-full flex items-center justify-center text-sm"
          })}
        >
          Settings
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}

export default memo(ChatSidebar);
