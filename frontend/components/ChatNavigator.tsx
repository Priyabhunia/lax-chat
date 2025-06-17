import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, User, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { useMessageSummaries, useMessages } from '../hooks/useSupabaseData';
import { useAuth } from '../providers/SupabaseAuthProvider';
import { useSidebar } from './ui/sidebar';

interface MessageNavigatorProps {
  threadId: string;
  scrollToMessage: (id: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

function ChatNavigator({
  threadId,
  scrollToMessage,
  isVisible,
  onClose,
}: MessageNavigatorProps) {
  const { user } = useAuth();
  const { position } = useSidebar();
  const { summaries } = useMessageSummaries(threadId);
  const { messages } = useMessages(threadId);
  
  // Determine the position based on sidebar position
  const navigatorPosition = position === 'right' ? 'left-0' : 'right-0';

  // Group messages by role for better navigation
  const messagesByRole = messages.reduce((acc: Record<string, any[]>, message: any) => {
    const role = message.role || 'unknown';
    if (!acc[role]) acc[role] = [];
    acc[role].push(message);
    return acc;
  }, {});
  
  // Count messages by role
  const userMessageCount = messagesByRole.user?.length || 0;
  const assistantMessageCount = messagesByRole.assistant?.length || 0;
  
  // Get summaries for navigation
  const navigationSummaries = summaries.filter((summary: any) => 
    // Filter logic if needed
    true
  );

  // Create a map of message roles for easier lookup
  const messageRoles = messages?.reduce((acc, message) => {
    acc[message._id] = message.role;
    return acc;
  }, {} as Record<string, string>) || {};

  return (
    <>
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed ${navigatorPosition} top-0 h-full w-80 bg-background border-l border-r z-50 transform transition-transform duration-300 ease-in-out ${
          isVisible 
            ? 'translate-x-0' 
            : position === 'right' 
              ? '-translate-x-full' 
              : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-sm font-medium">Chat Navigator</h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Close navigator"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden p-2">
            {navigationSummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                <p>No messages in this conversation yet.</p>
                <p>Start chatting to see navigation items.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2 p-2 h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-full">
                {navigationSummaries.map((summary) => {
                  const role = messageRoles[summary.messageId] || 'unknown';
                  return (
                <li
                  key={summary._id}
                  onClick={() => {
                    scrollToMessage(summary.messageId);
                        // On mobile, close the navigator after selecting
                        if (window.innerWidth < 1024) {
                          onClose();
                        }
                  }}
                      className="cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors flex items-start gap-2"
                >
                      <div className="flex-shrink-0 mt-1">
                        {role === 'user' ? (
                          <User className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Bot className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        {summary.content}
                      </div>
                </li>
                  );
                })}
            </ul>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default ChatNavigator;
