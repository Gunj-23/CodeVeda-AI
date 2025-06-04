'use client';

import React, { useState, useEffect, useRef } from 'react';
import AnimatedBackground from '@/components/common/animated-background';
import AppHeader from '@/components/layout/app-header';
import ChatWindow from '@/components/chat/chat-window';
import ChatInputArea from '@/components/chat/chat-input-area';
import type { Message } from '@/types';
import { LANGUAGES } from '@/types';
import { getChatResponseAction, translateTextAction, generateImageQueryAction } from './actions';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const initialMessage: Message = {
    id: 'initial-bot-message',
    text: "Welcome to CodeVeda AI! I'm your futuristic AI assistant. How can I help you today?",
    sender: 'bot',
    timestamp: new Date(),
  };

  useEffect(() => {
    setMessages([initialMessage]);
  }, []);


  const addMessage = (newMessage: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      { ...newMessage, id: Date.now().toString(), timestamp: new Date() } as Message,
    ]);
  };
  
  const addTypingIndicator = () => {
    const typingMessage: Message = {
      id: 'typing-indicator',
      text: '',
      sender: 'bot',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);
  };

  const removeTypingIndicator = () => {
    setMessages(prev => prev.filter(msg => msg.id !== 'typing-indicator'));
  };

  const handleSendMessage = async (text: string, isImageMode: boolean, language: string | null) => {
    if (!text.trim() && !isImageMode) return;

    const userMessage: Omit<Message, 'id' | 'timestamp'> = { text, sender: 'user' };
    addMessage(userMessage);
    setIsLoading(true);
    addTypingIndicator();

    try {
      if (isImageMode) {
        const imagePromptResult = await generateImageQueryAction(text);
        removeTypingIndicator();
        addMessage({
          sender: 'bot',
          text: `Here's an image prompt for: "${text}"`,
          imagePrompt: imagePromptResult.imagePrompt,
          imageUrl: `https://placehold.co/600x400.png?text=AI+Image+For+${encodeURIComponent(text.substring(0,20))}`,
        });
      } else {
        const history = messages.filter(m => !m.isTyping); // Exclude typing indicator from history
        const chatResponse = await getChatResponseAction(text, history);
        let botText = chatResponse.botResponse;
        let originalTextForBot;
        let translatedTextForBot;

        if (language && language !== 'en' && botText) { // Assuming 'en' is the default AI language
          originalTextForBot = botText;
          try {
            const translationResult = await translateTextAction(botText, language);
            translatedTextForBot = translationResult.translatedText;
            // Update botText to be the translated one if translation is successful
            if(translatedTextForBot) botText = translatedTextForBot;

          } catch (translateError) {
            console.error('Translation error:', translateError);
            toast({
              title: 'Translation Failed',
              description: 'Could not translate the response.',
              variant: 'destructive',
            });
            // Keep botText as original if translation fails
          }
        }
        removeTypingIndicator();
        addMessage({
          sender: 'bot',
          text: botText,
          originalText: originalTextForBot,
          translatedText: translatedTextForBot,
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      removeTypingIndicator();
      addMessage({
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
      });
      toast({
        title: 'Error',
        description: 'Failed to get response from AI.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <AnimatedBackground />
      <AppHeader />
      <main className="flex-grow flex flex-col container mx-auto px-4 pb-4 overflow-hidden">
        <ChatWindow messages={messages} />
        <ChatInputArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          languages={LANGUAGES}
        />
      </main>
    </div>
  );
}
