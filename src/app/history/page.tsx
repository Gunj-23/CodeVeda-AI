
'use client';

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import MessageBubble from '@/components/chat/message-bubble';
import type { Message, ChatSession } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trash2, MessageSquareText, Edit3, Check, XCircle } from 'lucide-react';
import AppHeader from '@/components/layout/app-header';
import AnimatedBackground from '@/components/common/animated-background';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';


const ALL_CHATS_KEY = 'codeVedaAllChats'; // Stores ChatSession[]

export default function HistoryPage() {
  const [allChatSessions, setAllChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const loadHistory = useCallback(() => {
    setIsLoading(true);
    const storedSessionsJson = localStorage.getItem(ALL_CHATS_KEY);
    if (storedSessionsJson) {
      try {
        const parsedSessions: ChatSession[] = JSON.parse(storedSessionsJson).map(
          (session: any) => ({
            ...session,
            messages: Array.isArray(session.messages) ? session.messages.map((msg: any) => ({ 
              ...msg,
              timestamp: new Date(msg.timestamp),
            })).filter((msg: Message) => !msg.isTyping) : [], 
            lastModified: new Date(session.lastModified),
          })
        );
        
        const sortedSessions = parsedSessions.sort((a,b) => b.lastModified.getTime() - a.lastModified.getTime());
        setAllChatSessions(sortedSessions.filter(session => session.messages.length > 0));
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
    router.push('/'); 
  };

  const handleRename = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  const handleSaveTitle = (sessionId: string) => {
    if (!editingTitle.trim()) {
      toast({ title: 'Invalid Title', description: 'Chat title cannot be empty.', variant: 'destructive' });
      return;
    }
    const updatedSessions = allChatSessions.map(session =>
      session.id === sessionId ? { ...session, title: editingTitle.trim(), lastModified: new Date() } : session
    );
    localStorage.setItem(ALL_CHATS_KEY, JSON.stringify(updatedSessions));
    setAllChatSessions(updatedSessions.sort((a,b) => b.lastModified.getTime() - a.lastModified.getTime()));
    setEditingSessionId(null);
    setEditingTitle('');
    toast({ title: 'Chat Renamed', description: `Chat successfully renamed to "${editingTitle.trim()}".` });
  };

  const handleCancelRename = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };
  
  const handleContinueChat = (sessionId: string) => {
    router.push(`/?sessionId=${sessionId}`);
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
              {allChatSessions.map((session) => (
                session.messages.length > 0 && ( 
                  <AccordionItem value={session.id} key={session.id} className="border-b border-border/30 last:border-b-0">
                    <AccordionTrigger className="py-3 px-4 text-sm hover:bg-card/50 rounded-t-md">
                      <div className="flex justify-between items-center w-full">
                        <span className="truncate max-w-[calc(100%-220px)] md:max-w-[calc(100%-180px)]" title={session.title}>{session.title}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-muted-foreground mr-2">{session.messages.length} messages</span>
                           <div
                             role="button"
                             tabIndex={0}
                             onClick={(e) => { e.stopPropagation(); handleContinueChat(session.id);}}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter' || e.key === ' ') {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 handleContinueChat(session.id);
                               }
                             }}
                             className={cn(buttonVariants({ size: "sm", variant: "outline" }), "text-xs h-7 px-2 border-primary/50 hover:bg-primary/10 cursor-pointer")}
                           >
                             Continue Chat
                           </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-card/20 p-0 rounded-b-md">
                       <div className="p-4">
                        {editingSessionId === session.id ? (
                          <div className="flex items-center gap-2 mb-3">
                            <Input 
                              type="text" 
                              value={editingTitle} 
                              onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingTitle(e.target.value)}
                              className="h-8 text-sm"
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(session.id)}
                            />
                            <Button size="icon" variant="ghost" onClick={() => handleSaveTitle(session.id)} className="h-8 w-8 text-green-400 hover:text-green-300"><Check size={18}/></Button>
                            <Button size="icon" variant="ghost" onClick={handleCancelRename} className="h-8 w-8 text-red-400 hover:text-red-300"><XCircle size={18}/></Button>
                          </div>
                        ) : (
                          <div className="flex justify-end mb-3">
                            <Button variant="ghost" size="sm" onClick={() => handleRename(session.id, session.title)} className="h-7 text-xs neon-text-accent hover:bg-accent/20">
                              <Edit3 size={14} className="mr-1"/> Rename
                            </Button>
                          </div>
                        )}
                        <ScrollArea className="h-[250px]"> 
                          <div className="space-y-3">
                            {session.messages.map((msg) => (
                              <MessageBubble key={msg.id} message={msg} />
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
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
