import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface User {
  userId: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function ConvexAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useAction(api.auth.login);
  const register = useAction(api.auth.register);

  useEffect(() => {
    // Check for stored user data in localStorage
    const storedUser = localStorage.getItem("convexUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("convexUser");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userData = await login({ email, password });
      setUser(userData);
      localStorage.setItem("convexUser", JSON.stringify(userData));
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
      const { userId } = await register({ email, password, name });
      // After registration, log the user in
      const userData = await login({ email, password });
      setUser(userData);
      localStorage.setItem("convexUser", JSON.stringify(userData));
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("convexUser");
  };

  const value = {
    user,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a ConvexAuthProvider");
  }
  return context;
} 