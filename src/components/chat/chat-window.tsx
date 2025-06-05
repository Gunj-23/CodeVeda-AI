
'use client';

import type { Message } from '@/types';
import MessageBubble from './message-bubble';
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null); // Ref for the ScrollArea's viewport content

  useEffect(() => {
    if (scrollViewportRef.current) {
      // Scroll to the bottom of the viewport content
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-grow h-[calc(100vh-250px)] md:h-[calc(100vh-220px)] p-4 glassmorphic rounded-lg shadow-lg mb-4">
       {/* The direct child of ScrollArea's Viewport is what needs to be scrolled.
           We give this child the ref and allow its height to grow.
           Removed overflow-y-auto from this inner div as ScrollArea handles it. */}
      <div ref={scrollViewportRef} className="h-full">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    </ScrollArea>
  );
};

export default ChatWindow;
