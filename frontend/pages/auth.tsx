import { useState, useEffect } from "react";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import { useAuth } from "../providers/SupabaseAuthProvider";
import { Navigate, useNavigate } from "react-router-dom";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, isLoading, refreshSession } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();
  
  // Try to refresh session once on page load
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("[DEBUG] Auth page attempting session refresh");
      refreshSession().catch(error => 
        console.error("[DEBUG] Auth page session refresh error:", error)
      );
    }
  }, []);

  // Handle redirection when user auth state changes
  useEffect(() => {
    if (user && !isLoading && !redirecting) {
      setRedirecting(true);
      console.log("[DEBUG] Auth state changed, redirecting in 1 second...");
      
      const timer = setTimeout(() => {
        navigate('/');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, navigate]);

  // Show redirect message if we have a user
  if (user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="rounded-md bg-green-50 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Authentication successful!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>You are now logged in. Redirecting to home page...</p>
                </div>
              </div>
            </div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">lax</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Privacy-first AI chat application
          </p>
        </div>

        {isLogin ? <LoginForm /> : <RegisterForm />}

        <div className="text-center mt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
} 