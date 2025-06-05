
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquareText, PlusCircle, History } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { ChatSession, Message } from '@/types'; 

const ALL_CHATS_KEY = 'codeVedaAllChats'; // Stores ChatSession[]

const createInitialMessageForHeader = (): Message => ({ 
  id: Date.now().toString() + '_initial_bot_header',
  text: "Welcome to CodeVeda AI! I'm your futuristic AI assistant. How can I help you today?",
  sender: 'bot',
  timestamp: new Date(),
});

const createNewSessionForHeader = (title?: string): ChatSession => {
  const newId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id: newId,
    title: title || `New Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}`,
    messages: [createInitialMessageForHeader()],
    lastModified: new Date(),
  };
};

interface AppHeaderProps {
  onNewChat?: () => void; // Propagated from page.tsx for handling new chat on main page
}

const AppHeader: React.FC<AppHeaderProps> = ({ onNewChat }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleNewChatClick = () => {
    if (onNewChat && pathname === '/') { 
      onNewChat();
    } else { 
      // This logic is for when "New Chat" is clicked from history page or if onNewChat isn't available.
      // It creates a new session, saves it, and navigates to main page, making it active.
      const storedSessionsJson = localStorage.getItem(ALL_CHATS_KEY);
      let allSessions: ChatSession[] = [];
      if (storedSessionsJson) {
        try {
          // Assuming new format ChatSession[] is stored
          allSessions = JSON.parse(storedSessionsJson).map((s: any) => ({
            ...s,
            messages: s.messages.map((m: any) => ({...m, timestamp: new Date(m.timestamp)})),
            lastModified: new Date(s.lastModified)
          }));
        } catch (error) {
          console.error('Error parsing sessions for new chat from header:', error);
          allSessions = []; 
        }
      }
      
      const newSession = createNewSessionForHeader();
      allSessions.push(newSession);
      localStorage.setItem(ALL_CHATS_KEY, JSON.stringify(allSessions));
      
      // Navigate to main page, passing the new session ID so it becomes active
      router.push(`/?sessionId=${newSession.id}`);
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
