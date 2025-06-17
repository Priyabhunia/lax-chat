import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { Tables } from '../supabase';
import { updateThread } from './threads';

export interface Message {
  id: string;
  threadId: string;
  content: string;
  role: string;
  createdAt: number;
  userId: string;
}

export interface MessageSummary {
  id: string;
  threadId: string;
  messageId: string;
  content: string;
  createdAt: number;
  userId: string;
}

// Get messages by thread ID
export async function getMessagesByThreadId(threadId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error(error.message);
  }

  return (data || []).map((message: Tables['messages']) => ({
    id: message.id,
    threadId: message.thread_id,
    content: message.content,
    role: message.role,
    createdAt: message.created_at,
    userId: message.user_id,
  }));
}

// Create a new message
export async function createMessage(
  threadId: string,
  content: string,
  role: string,
  userId: string
): Promise<Message> {
  const now = Date.now();
  const messageId = uuidv4();

  const newMessage = {
    id: messageId,
    thread_id: threadId,
    content,
    role,
    created_at: now,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('messages')
    .insert([newMessage])
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    throw new Error(error.message);
  }

  // Update the thread's lastMessageAt timestamp
  await updateThread(threadId, { lastMessageAt: now });

  return {
    id: data.id,
    threadId: data.thread_id,
    content: data.content,
    role: data.role,
    createdAt: data.created_at,
    userId: data.user_id,
  };
}

// Get message summaries by thread ID
export async function getMessageSummariesByThreadId(threadId: string): Promise<MessageSummary[]> {
  const { data, error } = await supabase
    .from('message_summaries')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching message summaries:', error);
    throw new Error(error.message);
  }

  return (data || []).map((summary: Tables['message_summaries']) => ({
    id: summary.id,
    threadId: summary.thread_id,
    messageId: summary.message_id,
    content: summary.content,
    createdAt: summary.created_at,
    userId: summary.user_id,
  }));
}

// Create a new message summary
export async function createMessageSummary(
  threadId: string,
  messageId: string,
  content: string,
  userId: string
): Promise<MessageSummary> {
  const now = Date.now();
  const summaryId = uuidv4();

  const newSummary = {
    id: summaryId,
    thread_id: threadId,
    message_id: messageId,
    content,
    created_at: now,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('message_summaries')
    .insert([newSummary])
    .select()
    .single();

  if (error) {
    console.error('Error creating message summary:', error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    threadId: data.thread_id,
    messageId: data.message_id,
    content: data.content,
    createdAt: data.created_at,
    userId: data.user_id,
  };
}

// Delete a message
export async function deleteMessage(messageId: string): Promise<void> {
  // First delete any message summaries associated with this message
  const { error: summaryError } = await supabase
    .from('message_summaries')
    .delete()
    .eq('message_id', messageId);

  if (summaryError) {
    console.error('Error deleting message summaries:', summaryError);
    throw new Error(summaryError.message);
  }

  // Then delete the message itself
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
    throw new Error(error.message);
  }
} 