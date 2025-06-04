
'use client';

import React, { useState, useEffect, useRef } from 'react';
import AnimatedBackground from '@/components/common/animated-background';
import AppHeader from '@/components/layout/app-header';
import ChatWindow from '@/components/chat/chat-window';
import ChatInputArea from '@/components/chat/chat-input-area';
import type { Message } from '@/types';
import { LANGUAGES } from '@/types';
import { getChatResponseAction, translateTextAction, generateImageQueryAction, generateActualImageAction } from './actions';
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


  const addMessage = (newMessageOmitIdTimestamp: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...newMessageOmitIdTimestamp,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 15), 
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
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

    const userMessageText = text; 

    const historyForAI = messages.filter(m => !m.isTyping);

    addMessage({ text: userMessageText, sender: 'user' });
    
    setIsLoading(true);
    addTypingIndicator();

    try {
      if (isImageMode) {
        const imagePromptResult = await generateImageQueryAction(userMessageText);
        const enhancedPrompt = imagePromptResult.imagePrompt;

        if (!enhancedPrompt) {
            removeTypingIndicator();
            addMessage({
                sender: 'bot',
                text: "Sorry, I couldn't come up with an image prompt for that. Please try a different description.",
            });
            toast({
                title: 'Image Prompt Generation Failed',
                description: 'Could not generate an image prompt.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }
        
        const actualImageResult = await generateActualImageAction(enhancedPrompt);

        removeTypingIndicator();
        addMessage({
          sender: 'bot',
          text: `Here's an image I generated based on the prompt: "${enhancedPrompt}"`,
          imagePrompt: enhancedPrompt,
          imageUrl: actualImageResult.imageDataUri, 
        });
      } else {
        const chatResponse = await getChatResponseAction(userMessageText, historyForAI);
        let botText = chatResponse.botResponse;
        let originalTextForBot;
        let translatedTextForBot;

        if (language && language !== 'en' && botText) { 
          originalTextForBot = botText;
          try {
            const translationResult = await translateTextAction(botText, language);
            translatedTextForBot = translationResult.translatedText;
            if(translatedTextForBot) botText = translatedTextForBot;
          } catch (translateError) {
            console.error('Translation error:', translateError);
            toast({
              title: 'Translation Failed',
              description: 'Could not translate the response.',
              variant: 'destructive',
            });
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
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.';
      addMessage({
        sender: 'bot',
        text: errorMessage,
      });
      toast({
        title: 'Error',
        description: 'Failed to get response from AI. ' + (error instanceof Error ? error.message : ''),
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
