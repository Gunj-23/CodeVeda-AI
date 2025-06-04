'use client';

import type { Message } from '@/types';
import MessageBubble from './message-bubble';
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-grow h-[calc(100vh-250px)] md:h-[calc(100vh-220px)] p-4 glassmorphic rounded-lg shadow-lg mb-4" ref={scrollAreaRef}>
       <div ref={viewportRef} className="h-full">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    </ScrollArea>
  );
};

export default ChatWindow;
