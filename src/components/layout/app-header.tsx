
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquareText, PlusCircle, History } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AppHeaderProps {
  onNewChat?: () => void; // Optional: for triggering new chat from main page context
}

const AppHeader: React.FC<AppHeaderProps> = ({ onNewChat }) => {
  const pathname = usePathname();

  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    } else if (typeof window !== 'undefined') {
      // Fallback for history page or if onNewChat is not provided from main page
      localStorage.removeItem('chatMessages'); // CHAT_MESSAGES_KEY
      window.location.href = '/'; // Navigate and force reload of main page
    }
  };

  return (
    <header className="py-3 px-4 md:px-6 sticky top-0 z-10 glassmorphic mb-4 border-b-2 border-primary/70 shadow-[0_6px_25px_-8px_hsl(var(--primary)/0.6)]">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <MessageSquareText size={32} className="text-primary group-hover:animate-pulse" />
          <h1 className="text-2xl md:text-3xl font-headline font-bold neon-text-primary tracking-wider">
            CodeVeda AI
          </h1>
        </Link>
        <nav className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="sm" onClick={handleNewChatClick} className="neon-text-accent hover:bg-accent/20">
            <PlusCircle size={18} className="mr-1 md:mr-2" />
            New Chat
          </Button>
          {pathname !== '/history' && (
            <Link href="/history" passHref>
              <Button variant="ghost" size="sm" className="neon-text-accent hover:bg-accent/20">
                <History size={18} className="mr-1 md:mr-2" />
                History
              </Button>
            </Link>
          )}
          {pathname === '/history' && (
             <Link href="/" passHref>
              <Button variant="ghost" size="sm" className="neon-text-accent hover:bg-accent/20">
                <MessageSquareText size={18} className="mr-1 md:mr-2" />
                Chat
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
