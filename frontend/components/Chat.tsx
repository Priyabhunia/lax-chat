import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/frontend/providers/ConvexAuthProvider';
import { useCreateMessage, useUpdateThread } from '@/frontend/hooks/useConvexData';
import { UIMessage } from 'ai';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';
import { useModelStore } from '@/frontend/stores/ModelStore';
import { Button } from './ui/button';
import Messages from './Messages';
import ChatInput from './ChatInput';
import ChatNavigator from './ChatNavigator';
import { MessageSquareMore } from 'lucide-react';
import { toast } from 'sonner';
import ThemeToggler from '@/frontend/components/ui/ThemeToggler';
import { SidebarTrigger, useSidebar } from '@/frontend/components/ui/sidebar';
import { useChatNavigator } from '@/frontend/hooks/useChatNavigator';
import { callGeminiAPI, callOpenAIAPI, callOpenRouterAPI } from '../utils/apiHelpers';

// Helper function to scroll to the bottom of the container
const scrollToBottom = () => {
  const messagesContainer = document.querySelector('main');
  if (messagesContainer) {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  }
};

interface ChatProps {
  threadId: string;
  initialMessages: UIMessage[];
}

export default function Chat({ threadId, initialMessages }: ChatProps) {
  const { getKey } = useAPIKeyStore();
  const selectedModel = useModelStore((state) => state.selectedModel);
  const modelConfig = useModelStore((state) => state.getModelConfig());
  const { user } = useAuth();
  const createMessage = useCreateMessage();
  const updateThread = useUpdateThread();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isNavigatorVisible,
    handleToggleNavigator,
    closeNavigator,
    registerRef,
    scrollToMessage,
  } = useChatNavigator();

  const { position } = useSidebar();

  // Function to scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    const messagesContainer = document.querySelector('main');
    if (messagesContainer) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Get API key for the selected model
  const apiKey = getKey(modelConfig.provider);
  
  // Debug API configuration
  useEffect(() => {
    console.log('Model config:', {
      model: selectedModel,
      modelId: modelConfig.modelId,
      provider: modelConfig.provider,
      headerKey: modelConfig.headerKey,
      hasApiKey: !!apiKey,
    });
  }, [selectedModel, modelConfig, apiKey]);

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
        await createMessage(threadId, aiMessage, user.userId);
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
      scrollToBottom();
    }
  }, [messages, status, scrollToBottom]);

  // Custom submit handler for direct API calls
  const handleSubmit = async (userMessage: string) => {
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
    
    // Scroll to bottom after adding user message
    setTimeout(scrollToBottom, 100);
    
    // Save user message to database
    try {
      await createMessage(threadId, userMsg, user?.userId || '');
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
      await createMessage(threadId, aiMsg, user?.userId || '');
      
      // Scroll to bottom after adding AI message
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error("API Error:", error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to get response'}`);
    } finally {
      setIsGenerating(false);
    }
  };

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
      document.title = `${newTitle} - Chat0`;
      
      // Update thread title in database if this is the first user message
      if (userMessages.length === 1 && user) {
        updateThread(threadId, newTitle).catch(err => {
          console.error('Failed to update thread title:', err);
        });
      }
    } else {
      // Default title when no messages
      document.title = 'New Chat - Chat0';
    }
  }, [messages, threadId, updateThread, user]);

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
  const navigatorButtonPosition = position === 'right' ? 'left-16' : 'right-16';

  return (
    <div className="relative w-full">
      <SidebarTrigger />
      <main
        className={`flex flex-col w-full max-w-3xl pt-10 pb-44 mx-auto transition-all duration-300 ease-in-out overflow-y-auto`}
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
        <div ref={messagesEndRef} />
      </main>
      
      <div className="chat-input-container fixed bottom-0 left-0 right-0 z-10">
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
      </div>
      
      <ThemeToggler />
      <Button
        onClick={handleToggleNavigator}
        variant="outline"
        size="icon"
        className={`fixed ${navigatorButtonPosition} top-4 z-20`}
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
}
