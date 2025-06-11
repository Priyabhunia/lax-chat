import Chat from '../components/Chat';
import { useParams } from 'react-router-dom';
import { useMessages } from '../hooks/useConvexData';
import { useAuth } from '../providers/ConvexAuthProvider';
import { UIMessage } from 'ai';

export default function Thread() {
  const { id } = useParams();
  const { user } = useAuth();
  
  if (!id) throw new Error('Thread ID is required');
  if (!user) return null;

  // Convert ID from string to Convex ID (this will be handled by the hook)
  const messages = useMessages(id);

  const convertToUIMessages = (messages?: any[]): UIMessage[] => {
    if (!messages) return [];
    
    return messages.map((message) => {
      // Ensure role is one of the allowed types
      let role: 'user' | 'assistant' | 'system' = 'user';
      if (message.role === 'assistant' || message.role === 'system') {
        role = message.role;
      }
      
      return {
        id: message._id.toString(),
        role,
        content: message.content || '',
        createdAt: new Date(message.createdAt),
        parts: [{ type: "text" as const, text: message.content }]
      };
    });
  };

  const uiMessages = convertToUIMessages(messages);

  return (
    <Chat
      key={id}
      threadId={id}
      initialMessages={uiMessages}
    />
  );
}
