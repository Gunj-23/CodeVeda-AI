
'use client';

import type { Message } from '@/types';
import MessageBubble from './message-bubble';
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      // Using setTimeout to ensure DOM update is complete before scrolling
      setTimeout(() => {
        if (viewportRef.current) {
           viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-grow h-[calc(100vh-250px)] md:h-[calc(100vh-220px)] p-4 glassmorphic rounded-lg shadow-lg mb-4">
       <div ref={viewportRef} className="h-full overflow-y-auto"> {/* Ensure this div is the one that actually scrolls if ScrollArea isn't doing it directly */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    </ScrollArea>
  );
};

export default ChatWindow;
