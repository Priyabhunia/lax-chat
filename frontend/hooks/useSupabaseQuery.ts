import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';

// Simple cache to prevent duplicate requests
const queryCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 30000; // 30 seconds cache lifetime (reduced from 120s)
const GLOBAL_REQUEST_COUNT = {count: 0, lastReset: Date.now()};
const MAX_REQUESTS_PER_MINUTE = 60; // Maximum 60 requests per minute

// Reset the global counter every minute
setInterval(() => {
  GLOBAL_REQUEST_COUNT.count = 0;
  GLOBAL_REQUEST_COUNT.lastReset = Date.now();
}, 60000);

// Generate a cache key from query function and dependencies
const generateCacheKey = (fn: Function, deps: any[]) => {
  return `${fn.toString()}_${JSON.stringify(deps)}`;
};

// A simple hook to replace Convex's useQuery with caching
export function useSupabaseQuery<T>(
  queryFn: (supabase: ReturnType<typeof useSupabase>) => Promise<T>,
  dependencies: any[] = [],
  options: { 
    skipCache?: boolean, 
    bypassThrottle?: boolean 
  } = {}
) {
  const supabase = useSupabase();
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [queryCount, setQueryCount] = useState(0);
  const lastQueryTime = useRef<number>(0);
  const cacheKey = useRef<string>("");
  const isMounted = useRef(true);
  const depsRef = useRef(dependencies);
  
  // Move cache key updates to useEffect to avoid render-phase state updates
  useEffect(() => {
    cacheKey.current = generateCacheKey(queryFn, dependencies);
    depsRef.current = dependencies;
  }, [queryFn, dependencies]);

  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(async (ignoreCache = false) => {
    const skipCache = ignoreCache || options.skipCache;
    const bypassThrottle = options.bypassThrottle || false;
    
    // Global rate limiting (unless bypassing throttle)
    if (!bypassThrottle && GLOBAL_REQUEST_COUNT.count >= MAX_REQUESTS_PER_MINUTE) {
      console.log("Rate limit reached. Skipping fetch.");
      return;
    }
    
    // Throttle requests - no more than 1 request per 1000ms (reduced from 3000ms)
    // Skip throttling if we're bypassing it (useful for high-priority queries)
    const now = Date.now();
    if (!bypassThrottle && now - lastQueryTime.current < 1000) {
      return;
    }
    
    // Avoid excessive queries
    if (!bypassThrottle && queryCount > 2) {
      return;
    }
    
    // Check cache first
    if (!skipCache) {
      const cachedResult = queryCache.get(cacheKey.current);
      if (cachedResult && (now - cachedResult.timestamp < CACHE_TTL)) {
        setData(cachedResult.data);
        setIsLoading(false);
        return;
      }
    }
    
    // If component is unmounted, don't proceed
    if (!isMounted.current) return;
    
    // Update rate limiting counters
    lastQueryTime.current = now;
    GLOBAL_REQUEST_COUNT.count++;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await queryFn(supabase);
      
      // If component is unmounted, don't update state
      if (!isMounted.current) return;
      
      // Cache the result (even if skipCache is true for future requests)
      queryCache.set(cacheKey.current, {
        data: result,
        timestamp: Date.now()
      });
      
      setData(result);
      setQueryCount(count => count + 1);
    } catch (err) {
      // If component is unmounted, don't update state
      if (!isMounted.current) return;
      
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      // If component is unmounted, don't update state
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [queryFn, supabase, queryCount, options]);

  useEffect(() => {
    // Only fetch data once on mount or when dependencies change
    fetchData();
    
    // No cleanup needed here as we have the global isMounted ref
  }, [fetchData]);

  const refetch = useCallback((options?: { skipCache?: boolean, bypassThrottle?: boolean }) => {
    return fetchData(options?.skipCache || true);
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}

// A simple hook to replace Convex's useMutation
export function useSupabaseMutation<T, Args extends any[]>(
  mutationFn: (supabase: ReturnType<typeof useSupabase>, ...args: Args) => Promise<T>
) {
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  
  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const mutate = useCallback(
    async (...args: Args) => {
      if (!isMounted.current) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const result = await mutationFn(supabase, ...args);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (isMounted.current) {
          setError(error);
        }
        throw error;
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [mutationFn, supabase]
  );

  return { mutate, isLoading, error };
} 