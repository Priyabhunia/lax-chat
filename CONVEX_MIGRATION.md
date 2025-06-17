# Migrating to a New Convex Project

This document provides instructions for migrating your lax application to a new Convex project.

## Repository

https://github.com/Priyabhunia/me

## Why Migrate?

The previous Convex project reached its bandwidth limits due to:
- Query loops or inefficient queries
- Excessive database operations
- Subscription overuse

Migrating to a new project gives you a fresh start with optimized code.

## Migration Steps

### 1. Update Convex URL

The Convex URL has been updated in `frontend/app.tsx`:

```typescript
const convexUrl = (import.meta as any).env.VITE_CONVEX_URL || "https://your-new-project-url.convex.cloud";
```

**Important:** Replace `"https://your-new-project-url.convex.cloud"` with your actual new Convex project URL.

### 2. Create Environment File

Create a `.env.local` file in the root directory with:

```
VITE_CONVEX_URL=https://your-new-project-url.convex.cloud
```

Again, replace with your actual Convex project URL.

### 3. Deploy to the New Project

Run the following commands:

```bash
# Login to Convex (if needed)
npx convex login

# Deploy your functions to the new project
npm run deploy-convex
# or
npx convex deploy
```

### 4. Start the Application

```bash
npm run dev
```

## Optimizing for Lower Bandwidth Usage

To prevent hitting bandwidth limits again:

1. **Implement Pagination:**
   - Limit the number of records fetched in queries
   - Use cursor-based pagination for large datasets

2. **Optimize Queries:**
   - Only fetch the fields you need
   - Use proper indexes for frequently queried fields
   - Avoid nested queries when possible

3. **Manage Subscriptions:**
   - Limit the number of active subscriptions
   - Unsubscribe when components unmount
   - Use more specific subscriptions instead of broad ones

4. **Add Debouncing:**
   - Debounce user inputs that trigger queries
   - Implement throttling for high-frequency events

5. **Cache Results:**
   - Cache query results when appropriate
   - Implement local state management for frequently accessed data

6. **Monitor Usage:**
   - Regularly check your Convex dashboard for usage metrics
   - Set up alerts for approaching limits

## Troubleshooting

If you encounter issues:

1. Check that you're logged in to Convex
2. Verify your new project URL is correct
3. Ensure your schema is valid
4. Check for any errors in the deployment logs

For additional help, refer to the [Convex documentation](https://docs.convex.dev/). 