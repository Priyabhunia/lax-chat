# Convex Authentication and Backend Setup

This document provides instructions for setting up Convex authentication and backend for the lax application.

## Repository

https://github.com/Priyabhunia/me

## Setup Steps

### 1. Install Dependencies

The following dependencies have been added to the project:
- `convex`: The Convex client and server libraries
- `bcryptjs`: For password hashing

### 2. Convex Configuration

The Convex backend is configured with the following files:
- `convex/schema.ts`: Defines the database schema
- `convex/auth.js`: Provides authentication functions (register, login, getUser)
- `convex/authHelpers.js`: Helper functions for password hashing
- `convex/threads.ts`: API functions for thread management
- `convex/messages.ts`: API functions for message management
- `convex/http.js`: HTTP router for API endpoints

### 3. Important Note About Actions

Convex has different types of server functions:
- **Queries**: Read-only operations
- **Mutations**: Write operations
- **Actions**: Operations that can use external APIs and browser functions

For authentication with bcryptjs, we need to use **actions** because bcryptjs uses `setTimeout` internally, which is not allowed in queries or mutations. This is why we've implemented:

1. `auth.js` as a JavaScript file (to avoid TypeScript errors)
2. `authHelpers.js` to isolate the bcrypt functionality
3. A pattern where actions call queries and mutations for database operations

### 4. Environment Setup

Create a `.env.local` file in the root of your project with the following content:

```
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

Replace `your-convex-deployment` with your actual Convex deployment URL.

### 5. Initialize Convex

Run the following command to initialize your Convex deployment:

```bash
npx convex dev
```

This will start the Convex development server and prompt you to log in if needed.

### 6. Authentication Components

The following components have been created for authentication:
- `frontend/providers/ConvexAuthProvider.tsx`: Context provider for authentication state
- `frontend/components/auth/LoginForm.tsx`: Login form component
- `frontend/components/auth/RegisterForm.tsx`: Registration form component
- `frontend/components/auth/ProtectedRoute.tsx`: Route protection component
- `frontend/pages/auth.tsx`: Authentication page with login/register forms

### 7. App Integration

The main `App.tsx` component has been updated to use Convex providers and authentication:

```tsx
<ConvexProvider client={convex}>
  <ConvexAuthProvider>
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  </ConvexAuthProvider>
</ConvexProvider>
```

## Usage

### Authentication

1. Users can register with email, password, and optional name
2. Users can log in with email and password
3. Authentication state is stored in localStorage for persistence
4. Protected routes redirect to the login page if not authenticated

### Data Storage

All chat data is now stored in Convex tables:
- `users`: User accounts with email and password
- `threads`: Chat threads linked to users
- `messages`: Individual messages in threads
- `messageSummaries`: Summaries of messages for navigation

### API Functions

The following API functions are available:

**Authentication:**
- `auth.register`: Register a new user (action)
- `auth.login`: Log in an existing user (action)
- `auth.getUser`: Get user details (query)
- `auth.checkEmailExists`: Check if an email is already registered (query)
- `auth.getUserByEmail`: Get a user by email (query)
- `auth.createUser`: Create a new user (mutation)

**Threads:**
- `threads.getThreads`: Get all threads for a user
- `threads.getThread`: Get a specific thread
- `threads.createThread`: Create a new thread
- `threads.updateThread`: Update a thread
- `threads.deleteThread`: Delete a thread and its messages

**Messages:**
- `messages.getMessages`: Get all messages in a thread
- `messages.createMessage`: Create a new message
- `messages.createMessageSummary`: Create a message summary
- `messages.getMessageSummaries`: Get summaries for a thread

## Next Steps

1. Run `pnpm convex` to start the Convex development server
2. Update the `.env.local` file with your actual Convex deployment URL
3. Migrate existing data from Dexie to Convex if needed
4. Test the authentication flow by registering and logging in
5. Implement any additional backend features specific to your application 