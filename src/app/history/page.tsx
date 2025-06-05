
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MessageBubble from '@/components/chat/message-bubble';
import type { Message } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Trash2, MessageSquareText, ChevronDown, ChevronUp } from 'lucide-react';
import AppHeader from '@/components/layout/app-header';
import AnimatedBackground from '@/components/common/animated-background';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ALL_CHATS_KEY = 'codeVedaAllChats';

export default function HistoryPage() {
  const [allChatSessions, setAllChatSessions] = useState<Message[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadHistory = useCallback(() => {
    setIsLoading(true);
    const storedSessionsJson = localStorage.getItem(ALL_CHATS_KEY);
    if (storedSessionsJson) {
      try {
        const parsedSessions: Message[][] = JSON.parse(storedSessionsJson).map(
          (session: any[]) =>
            session.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })).filter(msg => !msg.isTyping) // Filter out typing indicators from stored history
        );
        setAllChatSessions(parsedSessions.filter(session => session.length > 0)); // Only keep non-empty sessions
      } catch (error) {
        console.error('Error parsing sessions from localStorage:', error);
        setAllChatSessions([]);
        toast({
          title: 'Error loading history',
          description: 'Could not parse saved chat sessions.',
          variant: 'destructive',
        });
      }
    } else {
      setAllChatSessions([]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClearAllHistory = () => {
    localStorage.removeItem(ALL_CHATS_KEY);
    setAllChatSessions([]);
    toast({
      title: 'All Chat History Cleared',
      description: 'All your conversations have been removed.',
    });
    // Optionally, redirect to main page to start a new chat automatically
    if (typeof window !== 'undefined') {
        window.location.href = '/';
    }
  };

  const getSessionTitle = (session: Message[]): string => {
    if (session.length === 0) return "Empty Chat";
    const firstUserMessage = session.find(msg => msg.sender === 'user');
    const firstMessage = session[0];
    const date = new Date(firstMessage.timestamp);
    const formattedDate = date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (firstUserMessage) {
      return `Chat from ${formattedDate} at ${formattedTime} ("${firstUserMessage.text.substring(0, 30)}${firstUserMessage.text.length > 30 ? '...' : ''}")`;
    }
    return `Chat from ${formattedDate} at ${formattedTime}`;
  };


  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <AnimatedBackground />
      <AppHeader /> 
      <main className="flex-grow flex flex-col container mx-auto px-4 pb-4 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline neon-text-primary">Chat History</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearAllHistory} className="border-destructive text-destructive hover:bg-destructive/10">
              <Trash2 size={16} className="mr-2" /> Clear All History
            </Button>
            <Link href="/" passHref>
              <Button variant="ghost" className="neon-text-accent hover:bg-accent/20">
                <ArrowLeft size={16} className="mr-2" /> Back to Chat
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center py-10 text-lg">Loading history...</p>
        ) : allChatSessions.length > 0 ? (
          <ScrollArea className="flex-grow h-[calc(100vh-280px)] glassmorphic rounded-lg shadow-lg p-1">
            <Accordion type="multiple" className="w-full">
              {allChatSessions.map((session, index) => (
                session.length > 0 && ( // Ensure session is not empty
                  <AccordionItem value={`session-${index}`} key={`session-key-${index}`} className="border-b border-border/30 last:border-b-0">
                    <AccordionTrigger className="py-3 px-4 text-sm hover:bg-card/50 rounded-t-md">
                      <div className="flex justify-between items-center w-full">
                        <span>{getSessionTitle(session)}</span>
                        <span className="text-xs text-muted-foreground mr-2">{session.length} messages</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-card/20 p-0 rounded-b-md">
                      <ScrollArea className="h-[300px] p-4"> {/* Inner scroll for long chats */}
                        <div className="space-y-3">
                          {session.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                )
              ))}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 glassmorphic rounded-lg shadow-lg">
            <MessageSquareText size={72} className="text-muted-foreground opacity-40 mb-6" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-3">No Chat History Found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Your past conversations will appear here. Start a new chat to see your history grow!
            </p>
            <Link href="/" passHref>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow-primary px-6 py-3 text-base">
                Start a Conversation
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
