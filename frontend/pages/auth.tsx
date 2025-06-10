import { useState } from "react";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import { useAuth } from "../providers/ConvexAuthProvider";
import { Navigate } from "react-router-dom";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, isLoading } = useAuth();

  // Redirect if already logged in
  if (user && !isLoading) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">Chat0</h1>
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