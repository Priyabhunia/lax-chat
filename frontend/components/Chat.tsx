import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useChat } from '@ai-sdk/react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../providers/SupabaseAuthProvider';
import { useCreateMessage, useUpdateThread, useCreateMessageSummary, useMessages, useMessageSummaries } from '../hooks/useSupabaseData';
import { UIMessage } from 'ai';
import { useAPIKeyStore } from '../stores/APIKeyStore';
import { useModelStore } from '../stores/ModelStore';
import { Button } from './ui/button';
import Messages from './Messages';
import ChatInput from './ChatInput';
import ChatNavigator from './ChatNavigator';
import { MessageSquareMore } from 'lucide-react';
import { toast } from 'sonner';
import ThemeToggler from './ui/ThemeToggler';
import { SidebarTrigger, useSidebar } from './ui/sidebar';
import { useChatNavigator } from '../hooks/useChatNavigator';
import { callGeminiAPI, callOpenAIAPI, callOpenRouterAPI } from '../utils/apiHelpers';
import { useMessageSummary } from '../hooks/useMessageSummary';
import { useSupabaseMutation } from '../hooks/useSupabaseQuery';
import { useSupabase } from '../providers/SupabaseProvider';
// We don't need Convex imports since we're migrating to Supabase
// The necessary Supabase functionality is already available through the useAuth hook

interface ChatProps {
  threadId: string;
  initialMessages: UIMessage[];
}

// Helper function to create a summary from message content
const createSummaryFromMessage = (content: string): string => {
  // Truncate to first 50 characters or less
  const maxLength = 50;
  let summary = content.trim();
  
  // Remove markdown formatting
  summary = summary.replace(/[#*_~`]/g, '');
  
  // Truncate if needed and add ellipsis
  if (summary.length > maxLength) {
    const truncated = summary.substring(0, maxLength).trim();
    return truncated + '...';
  }
  
  return summary;
};

const Chat = memo(function Chat({ threadId, initialMessages }: ChatProps) {
  const { getKey } = useAPIKeyStore();
  const selectedModel = useModelStore((state) => state.selectedModel);
  const modelConfig = useModelStore((state) => state.getModelConfig());
  const { user } = useAuth();
  const createMessage = useCreateMessage();
  const updateThread = useUpdateThread();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { complete: createSummary } = useMessageSummary();
  const createMessageSummary = useCreateMessageSummary();
  const supabase = useSupabase();
  const prevPropsRef = useRef({ threadId, initialMessagesLength: initialMessages.length });
  
  // Function to scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    // Try multiple possible scroll containers to ensure we find the right one
    const scrollContainers = [
      document.getElementById('chat-scroll-container'),
      document.querySelector('.flex-1.overflow-auto'),
      document.querySelector('main'),
      document.querySelector('.overflow-auto')
    ];
    
    // Try scrolling the container
    for (const container of scrollContainers) {
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
        break;
      }
    }
    
    // Also try scrolling to the messages-end element
    const messagesEnd = document.getElementById('messages-end');
    if (messagesEnd) {
      messagesEnd.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  // Update refs for next render comparison
  useEffect(() => {
    prevPropsRef.current = { 
      threadId, 
      initialMessagesLength: initialMessages.length 
    };
  }, [threadId, initialMessages.length]);

  // Replace Convex mutation with Supabase mutation
  const { mutate: cleanupDuplicates } = useSupabaseMutation(async (supabase, threadId: string) => {
    // Find duplicates
    const { data: summaries, error: fetchError } = await supabase
      .from('message_summaries')
      .select('*')
      .eq('thread_id', threadId);
      
    if (fetchError) throw fetchError;
    
    // Find message IDs with multiple summaries
    const messageIdCounts = summaries?.reduce((acc, summary) => {
      acc[summary.message_id] = (acc[summary.message_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    // Get IDs of duplicate summaries to delete
    const duplicateIds: string[] = [];
    
    Object.entries(messageIdCounts).forEach(([messageId, count]) => {
      // Use type assertion for count
      if ((count as number) > 1) {
        // Keep the first summary, delete the rest
        const summariesForMessage = summaries?.filter(s => s.message_id === messageId) || [];
        const toDelete = summariesForMessage.slice(1);
        duplicateIds.push(...toDelete.map(s => s.id));
      }
    });
    
    if (duplicateIds.length === 0) return { deleted: 0 };
    
    // Delete duplicates
    const { error: deleteError } = await supabase
      .from('message_summaries')
      .delete()
      .in('id', duplicateIds);
      
    if (deleteError) throw deleteError;
    
    return { deleted: duplicateIds.length };
  });
  
  // Get messages and summaries for migration
  const { messages: allMessages } = useMessages(threadId);
  const { summaries: allSummaries } = useMessageSummaries(threadId);

  const {
    isNavigatorVisible,
    handleToggleNavigator,
    closeNavigator,
    registerRef,
    scrollToMessage,
  } = useChatNavigator();

  const { position } = useSidebar();
  
  // Create a ref to track initialization of navigator
  const hasInitialized = useRef(false);

  // Get API key for the selected model
  const apiKey = getKey(modelConfig.provider);

  const {
    messages,
    input,
    status,
    setInput,
    setMessages,
    append,
    stop,
    reload,
    error,
  } = useChat({
    id: threadId,
    initialMessages,
    experimental_throttle: 50,
    onFinish: async (response) => {
      if (!user) return;
      
      const content = response.parts?.[0]?.type === 'text' ? response.parts[0].text : '';
      
      const aiMessage: UIMessage = {
        id: uuidv4(),
        parts: response.parts || [],
        role: 'assistant',
        content: content,
        createdAt: new Date(),
      };

      try {
        const messageId = await createMessage(threadId, aiMessage, user.userId);
        
        // Create a summary for the AI message
        if (messageId && user) {
          // Create a direct summary from the message content
          const summary = createSummaryFromMessage(content);
          await createMessageSummary(threadId, messageId, summary, user.userId);
        }
        
        // Scroll to bottom when message is finished
        scrollToBottom();
      } catch (error) {
        console.error(error);
      }
    }
  });

  // Auto-scroll when messages change or when streaming
  useEffect(() => {
    if (messages.length > 0 || status === 'streaming') {
      // Use a single timeout for scrolling instead of multiple
      const scrollTimeout = setTimeout(() => {
        scrollToBottom();
        
        // Use the messagesEndRef to scroll if available
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [messages.length, status, scrollToBottom]); // Only depend on messages.length, not the entire messages array

  // Custom submit handler for direct API calls
  const handleSubmit = useCallback(async (userMessage: string) => {
    if (!apiKey || isGenerating) return;
    
    setErrorMessage(null);
    setIsGenerating(true);
    
    // Create user message
    const userMsg: UIMessage = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
      parts: [{ type: 'text', text: userMessage }]
    };
    
    // Add user message to UI
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    
    // Use a single timeout for scrolling
    setTimeout(scrollToBottom, 100);
    
    // Save user message to database
    try {
      const messageId = await createMessage(threadId, userMsg, user?.userId || '');
      
      // Create a summary for the user message
      if (messageId && user) {
        // Create a direct summary from the message content
        const summary = createSummaryFromMessage(userMessage);
        await createMessageSummary(threadId, messageId, summary, user.userId);
      }
    } catch (error) {
      console.error("Failed to save user message:", error);
    }
    
    try {
      // Call appropriate API based on provider
      let responseText = '';
      
      switch (modelConfig.provider) {
        case 'google':
          // For Google, we need to ensure we're using the correct model ID format
          responseText = await callGeminiAPI(updatedMessages, apiKey, modelConfig.modelId);
          break;
        case 'openai':
          responseText = await callOpenAIAPI(updatedMessages, apiKey, modelConfig.modelId);
          break;
        case 'openrouter':
          responseText = await callOpenRouterAPI(updatedMessages, apiKey, modelConfig.modelId);
          break;
        default:
          throw new Error(`Unsupported provider: ${modelConfig.provider}`);
      }
      
      // Create AI message
      const aiMsg: UIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: responseText,
        createdAt: new Date(),
        parts: [{ type: 'text', text: responseText }]
      };
      
      // Add AI message to UI
      setMessages([...updatedMessages, aiMsg]);
      
      // Save AI message to database
      const aiMessageId = await createMessage(threadId, aiMsg, user?.userId || '');
      
      // Create a summary for the AI message
      if (aiMessageId && user) {
        // Create a direct summary from the message content
        const summary = createSummaryFromMessage(responseText);
        await createMessageSummary(threadId, aiMessageId, summary, user.userId);
      }
      
      // Use a single timeout for scrolling
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error("API Error:", error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to get response'}`);
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, isGenerating, messages, threadId, user, createMessage, createMessageSummary, scrollToBottom, setMessages, modelConfig]);

  // Update document title based on first message
  useEffect(() => {
    // If there's at least one user message
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length > 0) {
      // Get the first user message
      const firstUserMessage = userMessages[0].content;
      
      // Use the first 30 characters as the title or the full message if shorter
      const newTitle = firstUserMessage.length > 30 
        ? firstUserMessage.substring(0, 30) + '...' 
        : firstUserMessage;
      
      // Update document title
      document.title = `${newTitle} - lax`;
      
      // Update thread title in database if this is the first user message
      if (userMessages.length === 1 && user) {
        updateThread(threadId, { title: newTitle }).catch((err: any) => {
          console.error('Failed to update thread title:', err);
        });
      }
    } else {
      // Default title when no messages
      document.title = 'New Chat - lax';
    }
  }, [messages, threadId, updateThread, user]);

  // Clean up duplicate summaries and create missing summaries when component mounts
  useEffect(() => {
    // Only run this once when the component mounts
    if (hasInitialized.current) return;
    
    const initializeNavigator = async () => {
      if (!user || !threadId || !allMessages) return;
      
      try {
        hasInitialized.current = true;
        
        // First clean up any duplicate summaries
        await cleanupDuplicates(threadId);
        
        // Wait for the cleanup to complete and get updated summaries
        const updatedSummaries = allSummaries;
        if (!updatedSummaries) return;
        
        // Create a set of message IDs that already have summaries
        const messagesWithSummaries = new Set(updatedSummaries.map((summary: any) => summary.messageId));
        
        // Find messages without summaries
        const messagesWithoutSummaries = allMessages.filter((message: any) => 
          !messagesWithSummaries.has(message._id)
        );
        
        // Limit the number of summaries we create at once to avoid overloading
        const MAX_SUMMARIES_TO_CREATE = 5;
        const limitedMessages = messagesWithoutSummaries.slice(0, MAX_SUMMARIES_TO_CREATE);
        
        // Create summaries for messages that don't have them
        for (const message of limitedMessages) {
          if (!message || !message.content) continue;
          
          const summary = createSummaryFromMessage(message.content);
          try {
            await createMessageSummary(threadId, message._id, summary, user.userId);
          } catch (error) {
            console.error(`Failed to create summary for message:`, error);
          }
        }
      } catch (error) {
        console.error("Failed to initialize navigator:", error);
      }
    };
    
    // Wrap in setTimeout to avoid immediate execution during render
    const timer = setTimeout(() => {
      initializeNavigator();
    }, 1000);
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, user, allMessages?.length]); // Simplified dependencies to avoid excessive re-renders

  if (!user) return null;

  // Show API key warning if no key is set for the selected model
  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                API key missing for {modelConfig.provider}. Please add your API key in the settings.
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => window.location.href = "/settings"}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Map our isGenerating state to valid status values expected by components
  const chatStatus = isGenerating ? 'streaming' : 'ready';
  
  // Determine button position based on sidebar position
  const navigatorButtonPosition = useMemo(() => 
    position === 'right' ? 'left-16' : 'right-16'
  , [position]);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto pb-48" id="chat-scroll-container">
        <div className="flex flex-col items-center">
          <main
            className={`flex flex-col w-full max-w-3xl pt-10 mx-auto transition-all duration-300 ease-in-out`}
          >
            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      Error: {errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <Messages
              threadId={threadId}
              messages={messages}
              status={chatStatus}
              setMessages={setMessages}
              reload={reload}
              error={error}
              registerRef={registerRef}
              stop={() => setIsGenerating(false)}
            />
            
            {/* Invisible div at the end to scroll to */}
            <div ref={messagesEndRef} className="h-1" id="messages-end" />
          </main>
        </div>
      </div>
      
      <ChatInput
        key={`chat-input-${threadId}`}
        threadId={threadId}
        input={input}
        status={chatStatus}
        append={(message) => {
          handleSubmit(message.content);
          return Promise.resolve(message.id);
        }}
        setInput={setInput}
        stop={() => setIsGenerating(false)}
        userId={user.userId}
      />
      
      <ThemeToggler />
      <Button
        onClick={handleToggleNavigator}
        variant="outline"
        size="icon"
        className={`fixed ${navigatorButtonPosition} top-4 z-50`}
        aria-label={
          isNavigatorVisible
            ? 'Hide message navigator'
            : 'Show message navigator'
        }
      >
        <MessageSquareMore className="h-5 w-5" />
      </Button>

      <ChatNavigator
        threadId={threadId}
        scrollToMessage={scrollToMessage}
        isVisible={isNavigatorVisible}
        onClose={closeNavigator}
      />
    </div>
  );
});

export default Chat;
