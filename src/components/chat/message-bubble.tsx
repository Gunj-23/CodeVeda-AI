
import type { Message } from '@/types';
import { Bot, User, Download } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const bubbleClasses = isUser
    ? 'bg-primary/80 text-primary-foreground self-end neon-glow-primary'
    : 'bg-accent/70 text-accent-foreground self-start neon-glow-accent'; // Slightly adjusted bot bubble opacity
  
  const IconOrAvatar = () => {
    if (isUser) {
      return <User className={`w-8 h-8 p-1.5 rounded-full bg-primary text-primary-foreground flex-shrink-0 shadow-md`} />;
    }
    // Consistent bot avatar placeholder
    const botAvatarSrc = "https://placehold.co/40x40.png";
    const botAltText = "Bot avatar placeholder";

    return (
      <Image
        src={botAvatarSrc}
        alt={botAltText}
        width={40}
        height={40}
        className="w-8 h-8 rounded-full flex-shrink-0 object-cover border-2 border-accent shadow-md" // Added border to bot avatar
        data-ai-hint="bot icon" // Hint for AI to replace with a robot/bot icon
      />
    );
  };


  return (
    <div
      className={`flex gap-2.5 my-3 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'} new-message-bounce`} // Adjusted gap and margin
      aria-live="polite"
    >
      <IconOrAvatar />
      <Card className={`max-w-md md:max-w-lg lg:max-w-xl p-3.5 glassmorphic ${bubbleClasses}`}> {/* Slightly increased padding */}
        <CardContent className="p-0">
          {message.isTyping ? (
            <div className="flex items-center space-x-1.5 p-2"> {/* Adjusted spacing */}
              <span className="text-sm opacity-90">CodeVeda AI is thinking</span>
              <span className="w-2 h-2 bg-current rounded-full animate-pulse delay-0"></span> {/* Slightly larger dots */}
              <span className="w-2 h-2 bg-current rounded-full animate-pulse delay-150"></span>
              <span className="w-2 h-2 bg-current rounded-full animate-pulse delay-300"></span>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words text-sm md:text-base">{message.text}</p> {/* Consistent text size */}
              {message.originalText && message.translatedText && (
                <div className="mt-2.5 pt-2.5 border-t border-border/50 opacity-85"> {/* Adjusted spacing and opacity */}
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
                        className="rounded-lg border-2 border-border/70 object-cover shadow-lg" // Enhanced image styling
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
        {!message.isTyping && (
          <CardFooter className="p-0 pt-1.5 text-xs opacity-60"> {/* Adjusted padding and opacity */}
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default MessageBubble;
