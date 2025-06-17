import { useCompletion } from '@ai-sdk/react';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';
import { toast } from 'sonner';
import { useCreateMessageSummary, useUpdateThread } from './useSupabaseData';
import { useAuth } from '../providers/SupabaseAuthProvider';

interface MessageSummaryPayload {
  title: string;
  isTitle?: boolean;
  messageId: string;
  threadId: string;
}

export const useMessageSummary = () => {
  const getKey = useAPIKeyStore((state) => state.getKey);
  const createMessageSummary = useCreateMessageSummary();
  const updateThread = useUpdateThread();
  const { user } = useAuth();

  const { complete, isLoading } = useCompletion({
    api: '/api/completion',
    ...(getKey('google') && {
      headers: { 'X-Google-API-Key': getKey('google')! },
    }),
    onResponse: async (response) => {
      if (!user) return;
      
      try {
        const payload: MessageSummaryPayload = await response.json();

        if (response.ok) {
          const { title, isTitle, messageId, threadId } = payload;

          if (isTitle) {
            await updateThread(threadId, { title });
            await createMessageSummary(threadId, messageId, title, user.userId);
          } else {
            await createMessageSummary(threadId, messageId, title, user.userId);
          }
        } else {
          toast.error('Failed to generate a summary for the message');
        }
      } catch (error) {
        console.error(error);
      }
    },
  });

  return {
    complete,
    isLoading,
  };
};
