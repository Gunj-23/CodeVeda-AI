
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MessageBubble from '@/components/chat/message-bubble';
import type { Message } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Trash2, MessageSquareText } from 'lucide-react';
import AppHeader from '@/components/layout/app-header'; // Re-use AppHeader
import AnimatedBackground from '@/components/common/animated-background';
import { useToast } from '@/hooks/use-toast';

const CHAT_MESSAGES_KEY = 'chatMessages';

export default function HistoryPage() {
  const [historyMessages, setHistoryMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedMessagesJson = localStorage.getItem(CHAT_MESSAGES_KEY);
    if (storedMessagesJson) {
      try {
        const parsedMessages: Message[] = JSON.parse(storedMessagesJson).map(
          (msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp), // Revive Date objects
          })
        );
        // Filter out any typing indicators that might have been saved
        setHistoryMessages(parsedMessages.filter(msg => !msg.isTyping));
      } catch (error) {
        console.error('Error parsing messages from localStorage:', error);
        setHistoryMessages([]);
        toast({
          title: 'Error loading history',
          description: 'Could not parse saved chat messages.',
          variant: 'destructive',
        });
      }
    }
    setIsLoading(false);
  }, [toast]);

  const handleStartNewChat = () => {
    localStorage.removeItem(CHAT_MESSAGES_KEY);
    setHistoryMessages([]); // Clear displayed history on this page
    toast({
      title: 'New Chat Started',
      description: 'Previous chat history has been cleared.',
    });
    // Optionally redirect to main chat page
    if (typeof window !== 'undefined') {
        window.location.href = '/';
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <AnimatedBackground />
      {/* Pass handleStartNewChat to AppHeader if it should also trigger this page's new chat logic */}
      <AppHeader onNewChat={handleStartNewChat} /> 
      <main className="flex-grow flex flex-col container mx-auto px-4 pb-4 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-headline neon-text-primary">Chat History</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleStartNewChat} className="border-destructive text-destructive hover:bg-destructive/10">
              <Trash2 size={16} className="mr-2" /> Clear History & Start New
            </Button>
            <Link href="/" passHref>
              <Button variant="ghost" className="neon-text-accent hover:bg-accent/20">
                <ArrowLeft size={16} className="mr-2" /> Back to Chat
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center py-10">Loading history...</p>
        ) : historyMessages.length > 0 ? (
          <ScrollArea className="flex-grow h-[calc(100vh-280px)] p-4 glassmorphic rounded-lg shadow-lg">
            <div className="space-y-4">
              {historyMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4 glassmorphic rounded-lg shadow-lg">
            <MessageSquareText size={64} className="text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Chat History Found</h3>
            <p className="text-muted-foreground mb-4">
              Your conversations will appear here once you start chatting.
            </p>
            <Link href="/" passHref>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow-primary">
                Start a Conversation
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
