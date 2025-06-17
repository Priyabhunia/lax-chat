import { useState, useEffect } from "react";

export function TestCors() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function testCORS() {
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      const log = (message: string) => {
        setResults(prev => [...prev, message]);
      };

      log(`Testing CORS for Supabase at: ${supabaseUrl}`);
      log(`API Key starts with: ${supabaseKey?.substring(0, 10)}...`);

      try {
        // Simple fetch to the auth endpoint to check CORS
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        log(`CORS test response status: ${response.status}`);
        
        const headers = Object.fromEntries([...response.headers.entries()]);
        log(`CORS test response headers: ${JSON.stringify(headers, null, 2)}`);
        
        const data = await response.json();
        log(`CORS test response data: ${JSON.stringify(data, null, 2)}`);
        
        log('✅ CORS test passed! Your Supabase instance is accessible from your frontend.');
        setSuccess(true);
      } catch (error: any) {
        log(`❌ CORS test failed! Error: ${error.message}`);
        log('\nPossible solutions:');
        log('1. Check your Supabase project settings and ensure that CORS is properly configured');
        log('2. Add your local development URL (http://localhost:3000) to the allowed origins in Supabase');
        log('3. Check your network connection and firewall settings');
        log('4. Verify that your Supabase instance is active and not in maintenance mode');
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    }

    testCORS();
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Supabase CORS Test</h2>
      
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">Testing CORS configuration...</span>
        </div>
      ) : (
        <div className="mt-4">
          <div className={`p-2 rounded ${success ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-bold">{success ? 'Success! ✅' : 'Failed! ❌'}</h3>
          </div>
          
          <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto max-h-[400px] text-sm">
            {results.map((line, i) => (
              <div key={i} className="py-0.5">
                {line}
              </div>
            ))}
          </pre>
          
          {!success && (
            <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded">
              <h3 className="font-bold text-lg mb-2">How to fix CORS issues:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase dashboard</a></li>
                <li>Select your project</li>
                <li>Go to Project Settings &gt; API</li>
                <li>Under "API Settings", find the "CORS" section</li>
                <li>Add <code className="bg-gray-200 px-1 rounded">http://localhost:3000</code> to the allowed origins</li>
                <li>Save the changes and wait a minute for them to take effect</li>
                <li>Refresh this page to test again</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 