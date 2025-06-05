
import type { Message } from '@/types';
import { Bot, User, Download } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [clientFormattedTimestamp, setClientFormattedTimestamp] = useState<string>('');

  useEffect(() => {
    // This effect runs only on the client, after initial hydration
    // message.timestamp should already be a Date object due to parsing in page.tsx/history/page.tsx
    const dateObject = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);
    
    if (!isNaN(dateObject.getTime())) { // Check if dateObject is valid
        setClientFormattedTimestamp(
          dateObject.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
    } else {
        // Fallback for invalid date
        setClientFormattedTimestamp('--:--'); 
    }
  }, [message.timestamp]);

  const isUser = message.sender === 'user';
  const bubbleClasses = isUser
    ? 'bg-primary/80 text-primary-foreground self-end neon-glow-primary'
    : 'bg-accent/70 text-accent-foreground self-start neon-glow-accent';
  
  const IconOrAvatar = () => {
    if (isUser) {
      return <User className={`w-8 h-8 p-1.5 rounded-full bg-primary text-primary-foreground flex-shrink-0 shadow-md`} />;
    }
    return (
      <Bot
        className={`w-8 h-8 p-1.5 rounded-full bg-accent text-accent-foreground flex-shrink-0 shadow-md`}
      />
    );
  };


  return (
    <div
      className={`flex gap-2.5 my-3 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'} new-message-bounce`}
      aria-live="polite"
    >
      <IconOrAvatar />
      <Card className={`max-w-md md:max-w-lg lg:max-w-xl p-3.5 glassmorphic ${bubbleClasses}`}>
        <CardContent className="p-0">
          {message.isTyping ? (
            <div className="flex items-center space-x-1.5 p-2">
              <span className="text-sm opacity-90">CodeVeda AI is thinking</span>
              <span className="w-2 h-2 bg-current rounded-full animate-pulse delay-0"></span>
              <span className="w-2 h-2 bg-current rounded-full animate-pulse delay-150"></span>
              <span className="w-2 h-2 bg-current rounded-full animate-pulse delay-300"></span>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words text-sm md:text-base">{message.text}</p>
              {message.originalText && message.translatedText && (
                <div className="mt-2.5 pt-2.5 border-t border-border/50 opacity-85">
                  <p className="text-xs font-semibold">Original:</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.originalText}</p>
                  <p className="text-xs font-semibold mt-1.5">Translated:</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.translatedText}</p>
                </div>
              )}
              {message.imagePrompt && (
                <div className="mt-2.5 pt-2.5 border-t border-border/50">
                  <p className="text-xs font-semibold">Image based on prompt:</p>
                  <Badge variant="secondary" className="my-1.5 text-xs bg-card/60 text-card-foreground/80">{message.imagePrompt}</Badge>
                  {message.imageUrl && (
                     <div className="mt-1.5">
                      <Image
                        src={message.imageUrl}
                        alt={message.imagePrompt ? `AI generated image for: ${message.imagePrompt}` : "AI generated image"}
                        width={300}
                        height={200}
                        className="rounded-lg border-2 border-border/70 object-cover shadow-lg"
                      />
                      {message.imageUrl.startsWith('data:image/') && (
                        <a
                          href={message.imageUrl}
                          download={`codeveda-ai-${message.id.substring(0,8)}.png`}
                          className="mt-2.5 inline-flex items-center"
                          aria-label="Download generated image"
                        >
                          <Button variant="outline" size="sm" className="bg-card/50 hover:bg-card/80 border-primary/50 hover:border-primary text-sm">
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Download
                          </Button>
                        </a>
                      )}
                     </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
        {!message.isTyping && clientFormattedTimestamp && (
          <CardFooter className="p-0 pt-1.5 text-xs opacity-60">
            {clientFormattedTimestamp}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default MessageBubble;
