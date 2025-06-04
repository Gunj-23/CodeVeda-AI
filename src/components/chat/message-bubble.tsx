
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
  
  const IconOrAvatar = () => {
    if (isUser) {
      return <User className={`w-8 h-8 p-1.5 rounded-full bg-primary text-primary-foreground flex-shrink-0`} />;
    }
    // For bot, use placeholder avatar if no specific imageUrl is set for a robot avatar (e.g. initial message)
    // but prefer message.avatarUrl if we want to set a specific avatar for the bot on a per-message basis (not used yet)
    const botAvatarSrc = message.avatarUrl || "https://placehold.co/40x40.png";
    const botAltText = message.avatarUrl ? "Bot avatar" : "Default bot avatar placeholder";
    const botHint = message.avatarUrl ? undefined : "bot icon";


    return (
      <Image
        src={botAvatarSrc}
        alt={botAltText}
        width={40}
        height={40}
        className="w-8 h-8 rounded-full flex-shrink-0 object-cover border border-accent"
        data-ai-hint={botHint}
      />
    );
  };


  return (
    <div
      className={`flex gap-2 my-2 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'} new-message-bounce`}
      aria-live="polite"
    >
      <IconOrAvatar />
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
                <div className="mt-2 pt-2 border-t border-border opacity-80">
                  <p className="text-xs font-medium">Original:</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.originalText}</p>
                  <p className="text-xs font-medium mt-1">Translated:</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.translatedText}</p>
                </div>
              )}
              {message.imagePrompt && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs font-medium">Image based on prompt:</p>
                  <Badge variant="secondary" className="my-1 text-xs">{message.imagePrompt}</Badge>
                  {message.imageUrl && (
                     <div>
                      <Image
                        src={message.imageUrl}
                        alt={message.imagePrompt ? `AI generated image for: ${message.imagePrompt}` : "AI generated image"}
                        width={300}
                        height={200}
                        className="rounded-md border border-border object-cover"
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
