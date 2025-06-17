import { supabase } from '../supabase';
import { Tables } from '../supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: number;
  updatedAt: number;
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 means no rows returned
      return null;
    }
    console.error('Error fetching user:', error);
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 means no rows returned
      return null;
    }
    console.error('Error fetching user by email:', error);
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// Update user
export async function updateUser(
  userId: string,
  updates: { name?: string }
): Promise<User> {
  const now = Date.now();

  const updateData: Partial<Tables['users']> = {
    updated_at: now,
  };

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
} 