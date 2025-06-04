import type { Message } from '@/types';
import { Bot, User } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const bubbleClasses = isUser
    ? 'bg-primary/80 text-primary-foreground self-end neon-glow-primary'
    : 'bg-accent/80 text-accent-foreground self-start neon-glow-accent';
  
  const Icon = isUser ? User : Bot;

  return (
    <div
      className={`flex gap-2 my-2 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'} new-message-bounce`}
      aria-live="polite"
    >
      <Icon className={`w-8 h-8 p-1.5 rounded-full ${isUser ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'} flex-shrink-0`} />
      <Card className={`max-w-md md:max-w-lg lg:max-w-xl p-3 glassmorphic ${bubbleClasses}`}>
        <CardContent className="p-0">
          {message.isTyping ? (
            <div className="flex items-center space-x-1 p-2">
              <span className="text-sm">CodeVeda AI is thinking</span>
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse delay-0"></span>
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse delay-200"></span>
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse delay-400"></span>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
              {message.originalText && message.translatedText && (
                <div className="mt-2 pt-2 border-t border-[var(--border-color)] opacity-80">
                  <p className="text-xs font-medium">Original:</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.originalText}</p>
                  <p className="text-xs font-medium mt-1">Translated:</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.translatedText}</p>
                </div>
              )}
              {message.imagePrompt && (
                <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                  <p className="text-xs font-medium">Generated Image Prompt:</p>
                  <Badge variant="secondary" className="my-1 text-xs">{message.imagePrompt}</Badge>
                  {message.imageUrl && (
                     <div>
                      <p className="text-xs text-muted-foreground mb-1">AI-generated image based on your description (placeholder):</p>
                      <Image
                        src={message.imageUrl}
                        alt="Generated image placeholder"
                        width={300}
                        height={200}
                        className="rounded-md border border-[var(--border-color)]"
                        data-ai-hint="abstract digital art"
                      />
                     </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
        {!message.isTyping && (
          <CardFooter className="p-0 pt-1 text-xs opacity-70">
            {new Date(message.timestamp).toLocaleTimeString()}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default MessageBubble;
