
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquareText, PlusCircle, History } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { Message } from '@/types'; // Import Message type

const ALL_CHATS_KEY = 'codeVedaAllChats';

const createInitialMessage = (): Message => ({ // Helper function to create initial message
  id: Date.now().toString() + '_initial_bot_header',
  text: "Welcome to CodeVeda AI! I'm your futuristic AI assistant. How can I help you today?",
  sender: 'bot',
  timestamp: new Date(),
});

interface AppHeaderProps {
  onNewChat?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onNewChat }) => {
  const pathname = usePathname();

  const handleNewChatClick = () => {
    if (onNewChat && pathname === '/') { // If onNewChat is provided (from main page)
      onNewChat();
    } else { // If on history page or onNewChat is not available from main page context
      const storedSessionsJson = localStorage.getItem(ALL_CHATS_KEY);
      let allSessions: Message[][] = [];
      if (storedSessionsJson) {
        try {
          allSessions = JSON.parse(storedSessionsJson);
        } catch (error) {
          console.error('Error parsing sessions for new chat from header:', error);
          allSessions = []; // Start fresh if parsing fails
        }
      }
      const newInitialMsg = createInitialMessage();
      
      // Check if the current last chat is just the initial bot message
      if (allSessions.length > 0) {
        const lastChat = allSessions[allSessions.length - 1];
        if (lastChat.length === 1 && lastChat[0].sender === 'bot' && lastChat[0].text === newInitialMsg.text) {
             allSessions[allSessions.length - 1] = [newInitialMsg];
        } else {
            allSessions.push([newInitialMsg]);
        }
      } else {
          allSessions.push([newInitialMsg]);
      }
      localStorage.setItem(ALL_CHATS_KEY, JSON.stringify(allSessions));
      
      if (typeof window !== 'undefined') {
        window.location.href = '/'; // Navigate and force reload of main page to load the new session
      }
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
