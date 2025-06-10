import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "./providers/ConvexAuthProvider";
import { AuthPage } from "./pages/auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import ChatLayout from "./ChatLayout";
import Home from './routes/Home';
import Index from './routes/Index';
import Thread from './routes/Thread';
import Settings from './routes/Settings';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Initialize Convex client
// This ensures we have a valid URL even if environment variables aren't loaded
// const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://silent-snail-247.convex.cloud";
const convexUrl = (import.meta as any).env.VITE_CONVEX_URL || "https://silent-snail-247.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

// Create router with future flags
const router = createBrowserRouter(
  [
    {
      path: "/auth",
      element: <AuthPage />
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <ChatLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Index /> },
        { path: "chat", element: <Home /> },
        { path: "chat/:id", element: <Thread /> },
        { path: "settings", element: <Settings /> }
      ]
    }
  ],
  {
  future: {
      // v7_startTransition: true,  
      v7_normalizeFormMethod: true,
    }
  }
);

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider>
        <RouterProvider router={router} />
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}
