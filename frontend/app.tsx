import { SupabaseProvider } from "./providers/SupabaseProvider";
import { SupabaseAuthProvider } from "./providers/SupabaseAuthProvider";
import { AuthPage } from "./pages/auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import ChatLayout from "./ChatLayout";
import Home from './routes/Home';
import Index from './routes/Index';
import Thread from './routes/Thread';
import Settings from './routes/Settings';
// import Diagnostics from './routes/diagnostics';
import TestCorsPage from './routes/test-cors';
// import Bypass from './routes/Bypass';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./components/ui/ThemeProvider";

// Create router with future flags
const router = createBrowserRouter(
  [
    {
      path: "/auth",
      element: <AuthPage />
    },
    // Diagnostics route removed
    {
      path: "/cors-test",
      element: <TestCorsPage />
    },
    // {
    //   path: "/bypass",
    //   element: <Bypass />
    // },
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

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SupabaseProvider>
        <SupabaseAuthProvider>
          <RouterProvider router={router} />
        </SupabaseAuthProvider>
      </SupabaseProvider>
    </ThemeProvider>
  );
}

export default App;
