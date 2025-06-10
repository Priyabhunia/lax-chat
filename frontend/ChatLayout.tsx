import ChatSidebar from '@/frontend/components/ChatSidebar';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from './components/ui/sidebar';
import { Button } from './components/ui/button';
import { Square } from 'lucide-react';

function MainContent() {
  const { isOpen, toggleSidebar } = useSidebar();
  
  return (
    <main className={`flex-1 relative overflow-auto transition-all duration-300 ${isOpen ? 'pl-0' : 'pl-0'}`}>
      {/* Persistent sidebar toggle button - only visible when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-50"
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

export default function ChatLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <ChatSidebar />
        <MainContent />
      </div>
    </SidebarProvider>
  );
}
