import ChatSidebar from '@/frontend/components/ChatSidebar';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from './components/ui/sidebar';
import { Button } from './components/ui/button';
import { Square } from 'lucide-react';
import React from 'react';

function MainContent() {
  const { isOpen, toggleSidebar, position } = useSidebar();
  
  // Use a stable button position that doesn't change when toggling
  const buttonPosition = React.useMemo(() => {
    return position === 'left' ? 'left-4' : 'right-4';
  }, [position]);
  
  return (
    <main className="flex-1 relative overflow-auto transition-all duration-300">
      {/* Persistent sidebar toggle button - only visible when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className={`fixed top-4 z-50 ${buttonPosition}`}
          onClick={toggleSidebar}
          aria-label="Open Sidebar"
        >
          <Square className="h-4 w-4" />
        </Button>
      )}
      <div className="p-4">
        <Outlet />
      </div>
    </main>
  );
}

function LayoutContent() {
  const { position } = useSidebar();
  
  console.log("LayoutContent rendering, position:", position);
  
  // Use React.useMemo to prevent unnecessary re-renders
  const layoutClassName = React.useMemo(() => {
    return `flex h-screen overflow-hidden bg-background sidebar-transition`;
  }, []);
  
  return (
    <div className={layoutClassName}>
      <ChatSidebar />
      <MainContent />
    </div>
  );
}

export default function ChatLayout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
