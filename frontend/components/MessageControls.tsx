import { useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Check, Copy, RefreshCcw } from 'lucide-react';
import { UIMessage } from 'ai';
import { UseChatHelpers } from '@ai-sdk/react';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';
import { toast } from 'sonner';
import { useModelStore } from '@/frontend/stores/ModelStore';
import { v4 as uuidv4 } from 'uuid';
import { useCreateMessage } from '../hooks/useSupabaseData';
import { useAuth } from '../providers/SupabaseAuthProvider';
import { callGeminiAPI, callOpenAIAPI, callOpenRouterAPI } from '../utils/apiHelpers';

interface MessageControlsProps {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers['setMessages'];
  content: string;
  reload: UseChatHelpers['reload'];
  stop: UseChatHelpers['stop'];
}

export default function MessageControls({
  threadId,
  message,
  setMessages,
  content,
  reload,
  stop,
}: MessageControlsProps) {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const hasRequiredKeys = useAPIKeyStore((state) => state.hasRequiredKeys());
  const getKey = useAPIKeyStore((state) => state.getKey);
  const modelConfig = useModelStore((state) => state.getModelConfig());
  const createMessage = useCreateMessage();
  const { user } = useAuth();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    
    try {
      setIsRegenerating(true);
      
      // Stop any ongoing requests
      stop();
      
      // Update UI to remove messages after this one
      if (message.role === 'user') {
        setMessages((messages) => {
          const index = messages.findIndex((m) => m.id === message.id);
          
          if (index !== -1) {
            const updatedMessages = [...messages.slice(0, index + 1)];
            return updatedMessages;
          }
          
          return messages;
        });
        
        // Wait a short time for UI to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the current messages after the UI update
        let currentMessages: UIMessage[] = [];
        setMessages(messages => {
          currentMessages = [...messages] as UIMessage[];
          return messages;
        });
        
        // Get API key for the selected model
        const apiKey = getKey(modelConfig.provider);
        if (!apiKey) {
          toast.error('API key is missing');
          return;
        }
        
        try {
          // Call appropriate API based on provider
          let responseText = '';
          
          switch (modelConfig.provider) {
            case 'google':
              responseText = await callGeminiAPI(currentMessages, apiKey, modelConfig.modelId);
              break;
            case 'openai':
              responseText = await callOpenAIAPI(currentMessages, apiKey, modelConfig.modelId);
              break;
            case 'openrouter':
              responseText = await callOpenRouterAPI(currentMessages, apiKey, modelConfig.modelId);
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
          setMessages([...currentMessages, aiMsg]);
          
          // Save AI message to database
          await createMessage(threadId, aiMsg, user?.userId || '');
          
        } catch (error) {
          console.error("API Error:", error);
          toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to get response'}`);
        }
      } else {
        // Find the last user message before this assistant message
        let lastUserMessage: UIMessage | null = null;
        
        setMessages((messages) => {
          const index = messages.findIndex((m) => m.id === message.id);
          
          if (index !== -1) {
            // Find the last user message before this assistant message
            let lastUserMessageIndex = -1;
            for (let i = index - 1; i >= 0; i--) {
              if (messages[i].role === 'user') {
                lastUserMessageIndex = i;
                lastUserMessage = messages[i] as UIMessage;
                break;
              }
            }
            
            // If we found a user message, keep everything up to and including it
            if (lastUserMessageIndex !== -1) {
              const updatedMessages = [...messages.slice(0, lastUserMessageIndex + 1)];
              return updatedMessages;
            }
            
            // Otherwise just remove this message
            const updatedMessages = [...messages.slice(0, index)];
            return updatedMessages;
          }
          
          return messages;
        });
        
        // For assistant messages, we need to wait a bit longer to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get the current messages after the UI update
        let currentMessages: UIMessage[] = [];
        setMessages(messages => {
          currentMessages = [...messages] as UIMessage[];
          return messages;
        });
        
        // If we have a user message to regenerate from
        if (lastUserMessage && user) {
          // Get API key for the selected model
          const apiKey = getKey(modelConfig.provider);
          if (!apiKey) {
            toast.error('API key is missing');
            return;
          }
          
          try {
            // Call appropriate API based on provider
            let responseText = '';
            
            switch (modelConfig.provider) {
              case 'google':
                responseText = await callGeminiAPI(currentMessages, apiKey, modelConfig.modelId);
                break;
              case 'openai':
                responseText = await callOpenAIAPI(currentMessages, apiKey, modelConfig.modelId);
                break;
              case 'openrouter':
                responseText = await callOpenRouterAPI(currentMessages, apiKey, modelConfig.modelId);
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
            setMessages([...currentMessages, aiMsg]);
            
            // Save AI message to database
            await createMessage(threadId, aiMsg, user.userId);
            
          } catch (error) {
            console.error("API Error:", error);
            toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to get response'}`);
          }
        }
      }
    } catch (error) {
      console.error('Error during regeneration:', error);
      toast.error('Failed to regenerate response');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div
      className={cn(
        'opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex gap-1',
        {
          'absolute mt-5 right-2': message.role === 'user',
        }
      )}
    >
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
      {hasRequiredKeys && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          <RefreshCcw className={cn("w-4 h-4", { "animate-spin": isRegenerating })} />
        </Button>
      )}
    </div>
  );
}
