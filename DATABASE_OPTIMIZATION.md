# Database Optimization Guide

This document provides strategies to optimize database usage and prevent hitting bandwidth limits in your Convex project.

## Recent Optimizations

We've made the following optimizations to reduce database bandwidth usage:

1. **Implemented Pagination:**
   - Added proper pagination to `getMessages` and `getThreads` queries
   - Using Convex's built-in pagination with `paginationOptsValidator`
   - This prevents loading entire collections at once

2. **Optimized Query Structure:**
   - Queries now use `.paginate()` instead of `.collect()`
   - This allows loading data in smaller chunks

## Additional Optimization Strategies

### 1. Client-Side Implementation

Update your React components to use the paginated queries:

```tsx
// Before
const messages = useQuery(api.messages.getMessages, { threadId });

// After
const { results, status, loadMore } = usePaginatedQuery(
  api.messages.getMessages, 
  { threadId }, 
  { initialNumItems: 20 }
);

// Use loadMore when user scrolls or clicks "Load More"
<button 
  onClick={() => loadMore(20)} 
  disabled={status !== "CanLoadMore"}
>
  Load More
</button>
```

### 2. Additional Query Optimizations

1. **Selective Field Fetching:**
   - Consider creating queries that only fetch required fields
   - For example, message previews don't need the full content

2. **Implement Debouncing:**
   - Add debouncing for user inputs that trigger queries
   - Example implementation:

```tsx
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  
  // Debounce search term to avoid excessive queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Only query when debouncedTerm changes
  const searchResults = useQuery(api.search.searchMessages, { term: debouncedTerm });
  
  return (
    <input 
      type="text" 
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search messages..."
    />
  );
}
```

3. **Optimize Subscriptions:**
   - Unsubscribe from queries when components unmount
   - Use more specific filters in your queries
   - Consider using `useQueries` for more control over subscription lifecycle

### 3. Caching Strategies

1. **Implement Client-Side Caching:**
   - Cache frequently accessed data client-side
   - Use local state management for UI-only data

2. **Use Optimistic Updates:**
   - Update UI immediately before server confirmation
   - Reduces perceived latency and database load

### 4. Monitoring and Alerts

1. **Add Logging:**
   - Log query frequency and payload sizes
   - Identify problematic queries causing high bandwidth usage

2. **Implement Rate Limiting:**
   - Add rate limiting for high-frequency operations
   - Prevent accidental infinite loops

## Best Practices

1. **Batch Operations:**
   - Group multiple database operations when possible
   - Reduces the number of network requests

2. **Proper Indexing:**
   - Ensure you have appropriate indexes for your queries
   - Improves query performance and reduces bandwidth

3. **Regular Monitoring:**
   - Check your Convex dashboard regularly
   - Watch for unexpected spikes in usage

4. **Clean Up Old Data:**
   - Implement data retention policies
   - Archive or delete old, unused data

By following these optimization strategies, you can significantly reduce database bandwidth usage and prevent hitting limits in the future. 