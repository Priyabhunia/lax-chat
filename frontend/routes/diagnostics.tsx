
import { useAuth } from '../providers/SupabaseAuthProvider';
import { useNavigate } from 'react-router-dom';

export default function DiagnosticsPage() {
  const { user, logout, refreshSession } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Supabase Diagnostics</h1>
      
      <div className="mb-6 max-w-xl mx-auto flex justify-between items-center">
        <div>
          {user ? (
            <div className="text-sm">
              Logged in as: <span className="font-semibold">{user.email}</span>
            </div>
          ) : (
            <div className="text-sm text-red-500">
              Not logged in
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {user ? (
            <>
              <button 
                onClick={async () => {
                  await refreshSession();
                  window.location.reload();
                }}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Refresh Session
              </button>
              <button 
                onClick={async () => {
                  await logout();
                  window.location.reload();
                }}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
            >
              Login
            </button>
          )}
        </div>
      </div>
      
      <SupabaseDiagnostics />
      
      <div className="mt-8 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold mb-3">Troubleshooting Steps:</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-medium text-blue-800">1. Check your SQL Schema</h3>
            <p className="mt-1 text-sm">
              Go to your Supabase dashboard and run the complete SQL schema again. 
              The schema includes commands to create tables and set up Row Level Security
              policies that are required for user operations.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-medium text-blue-800">2. Check your Auth Configuration</h3>
            <p className="mt-1 text-sm">
              Make sure Email/Password authentication is enabled in your Supabase project
              under Authentication → Providers.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-medium text-blue-800">3. Verify CORS Settings</h3>
            <p className="mt-1 text-sm">
              Go to Project Settings → API → CORS and make sure http://localhost:3000
              is added to the Additional Allowed Origins.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-medium text-blue-800">4. Try Logging Out and In Again</h3>
            <p className="mt-1 text-sm">
              Sometimes the auth session can get stale. Try logging out and logging back in
              to refresh your session token.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 