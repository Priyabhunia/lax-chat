import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { Id } from "../../convex/_generated/dataModel";

// Thread hooks
export function useThreads(userId: string | undefined) {
  return useQuery(
    api.threads.getThreads, 
    userId ? { userId: userId as Id<"users"> } : "skip"
  );
}

export function useThread(threadId: string | undefined) {
  return useQuery(
    api.threads.getThread, 
    threadId ? { threadId: threadId as Id<"threads"> } : "skip"
  );
}

export function useCreateThread() {
  const createThread = useMutation(api.threads.createThread);
  
  return async (title: string, userId: string) => {
    return await createThread({ 
      title, 
      userId: userId as Id<"users"> 
    });
  };
}

export function useUpdateThread() {
  const updateThread = useMutation(api.threads.updateThread);
  
  return async (threadId: string, title: string) => {
    return await updateThread({ 
      threadId: threadId as Id<"threads">, 
      title 
    });
  };
}

export function useDeleteThread() {
  const deleteThread = useMutation(api.threads.deleteThread);
  
  return async (threadId: string) => {
    try {
      const result = await deleteThread({ 
        threadId: threadId as Id<"threads"> 
      });
      
      // If result is null, the thread didn't exist
      if (result === null) {
        console.log(`Thread ${threadId} was already deleted or doesn't exist`);
      }
      
      return result;
    } catch (error) {
      console.error("Error deleting thread:", error);
      // Don't throw the error further, just log it
      return null;
    }
  };
}

// Message hooks
export function useMessages(threadId: string | undefined) {
  return useQuery(
    api.messages.getMessages, 
    threadId ? { threadId: threadId as Id<"threads"> } : "skip"
  );
}

export function useCreateMessage() {
  const createMessage = useMutation(api.messages.createMessage);
  
  return async (threadId: string, message: UIMessage, userId: string) => {
    return await createMessage({
      threadId: threadId as Id<"threads">,
      content: message.content,
      role: message.role,
      userId: userId as Id<"users">
    });
  };
}

// Message summary hooks
export function useMessageSummaries(threadId: string | undefined) {
  return useQuery(
    api.messages.getMessageSummaries, 
    threadId ? { threadId: threadId as Id<"threads"> } : "skip"
  );
}

export function useCreateMessageSummary() {
  const createSummary = useMutation(api.messages.createMessageSummary);
  
  return async (threadId: string, messageId: string, content: string, userId: string) => {
    return await createSummary({
      threadId: threadId as Id<"threads">,
      messageId: messageId as Id<"messages">,
      content,
      userId: userId as Id<"users">
    });
  };
} 