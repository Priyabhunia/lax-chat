import { useState } from "react";
import { useAuth } from "../../providers/SupabaseAuthProvider";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { register, isLoading, refreshSession } = useAuth();

  console.log("[DEBUG] RegisterForm rendered, isLoading:", isLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    console.log("[DEBUG] Registration attempt with:", { email, name, passwordLength: password.length });
    
    try {
      console.log("[DEBUG] Calling register function...");
      await register(email, password, name || undefined);
      console.log("[DEBUG] Register function completed successfully");
      
      // Show success message
      setMessage("Registration successful! Please wait...");
      
      // Try to refresh session to ensure it's available
      try {
        console.log("[DEBUG] Refreshing session after registration");
        await refreshSession();
      } catch (refreshError) {
        console.error("[DEBUG] Error refreshing session:", refreshError);
      }
      
    } catch (err: any) {
      console.error("[DEBUG] Registration error:", err);
      if (err.message?.includes('email')) {
        setError("This email may already be registered. Please try logging in.");
      } else {
        setError(err.message || "Registration failed");
      }
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
          {error.includes('email') && (
            <div className="mt-2">
              <button 
                className="text-blue-700 underline text-sm"
                onClick={() => window.location.reload()}
              >
                Go to login
              </button>
            </div>
          )}
        </div>
      )}
      
      {message && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
} 