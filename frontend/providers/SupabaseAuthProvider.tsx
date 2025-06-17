import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

// Use the same Supabase client instance from lib/supabase.ts

interface User {
  userId: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | undefined>;
  register: (email: string, password: string, name?: string) => Promise<User | undefined>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      // Clear any stored user data first
      localStorage.removeItem("supabaseUser");
      setUser(null);
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (session && session.user) {
        const userData: User = {
          userId: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
        };
        setUser(userData);
        localStorage.setItem("supabaseUser", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Session refresh error:", error);
    }
  };

  useEffect(() => {
    // Don't use localStorage for initial state - always check the actual session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setUser(null);
          localStorage.removeItem("supabaseUser");
        } else if (session && session.user) {
          const userData: User = {
            userId: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
          };
          setUser(userData);
          localStorage.setItem("supabaseUser", JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem("supabaseUser");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && session.user) {
          const userData: User = {
            userId: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
          };
          setUser(userData);
          localStorage.setItem("supabaseUser", JSON.stringify(userData));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem("supabaseUser");
        }
      }
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.user) {
        const userData: User = {
          userId: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
        };
        setUser(userData);
        localStorage.setItem("supabaseUser", JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      
      // Try with explicit options that might help with CORS
      const options = {
        emailRedirectTo: window.location.origin,
        data: {
          name,
        },
      };
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options,
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (!data || !data.user) {
          throw new Error("Registration failed: No user data returned");
        }
        
        // Create a new user record in our users table
        const userData: User = {
          userId: data.user.id,
          email: data.user.email || '',
          name: name,
        };
        
        // Store user data in state and localStorage
        setUser(userData);
        localStorage.setItem("supabaseUser", JSON.stringify(userData));
        
        return userData;
      } catch (supabaseError) {
        console.error("Registration failed:", supabaseError);
        throw supabaseError;
      }
    } catch (error) {
      console.error("Registration process failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("supabaseUser");
  };

  const value = {
    user,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a SupabaseAuthProvider");
  }
  return context;
} 