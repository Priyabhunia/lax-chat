import APIKeyManager from '../components/APIKeyForm';
import Chat from '../components/Chat';
import { v4 as uuidv4 } from 'uuid';
import { useAPIKeyStore } from '../stores/APIKeyStore';
import { useModelStore } from '../stores/ModelStore';
import { useAuth } from '../providers/ConvexAuthProvider';
import { useCreateThread } from '../hooks/useConvexData';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const hasRequiredKeys = useAPIKeyStore((state) => state.hasRequiredKeys());
  const { user } = useAuth();
  const createThread = useCreateThread();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isStoresReady, setIsStoresReady] = useState(false);

  useEffect(() => {
    // Check if stores are ready without using persist property
    setIsStoresReady(true);
  }, []);

  useEffect(() => {
    const initNewChat = async () => {
      if (user && !isCreating && isStoresReady) {
        setIsCreating(true);
        try {
          const threadId = await createThread("New Chat", user.userId);
          navigate(`/chat/${threadId}`);
        } catch (error) {
          console.error("Failed to create thread:", error);
          setIsCreating(false);
        }
      }
    };

    initNewChat();
  }, [user, createThread, navigate, isCreating, isStoresReady]);

  if (!isStoresReady) return null;

  if (!hasRequiredKeys)
    return (
      <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl pt-10 pb-44 mx-auto">
        <APIKeyManager />
      </div>
    );

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse">Creating new chat...</div>
    </div>
  );
}
