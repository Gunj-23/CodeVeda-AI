
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AnimatedBackground from '@/components/common/animated-background';
import AppHeader from '@/components/layout/app-header';
import ChatWindow from '@/components/chat/chat-window';
import ChatInputArea from '@/components/chat/chat-input-area';
import type { Message } from '@/types';
import { LANGUAGES } from '@/types';
import { getChatResponseAction, translateTextAction, generateImageQueryAction, generateActualImageAction } from './actions';
import { useToast } from '@/hooks/use-toast';

const ALL_CHATS_KEY = 'codeVedaAllChats'; // Array of Message[]

const createInitialMessage = (): Message => ({
  id: Date.now().toString() + '_initial_bot',
  text: "Welcome to CodeVeda AI! I'm your futuristic AI assistant. How can I help you today?",
  sender: 'bot',
  timestamp: new Date(),
});

export default function HomePage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLatestChat = useCallback(() => {
    const storedSessionsJson = localStorage.getItem(ALL_CHATS_KEY);
    if (storedSessionsJson) {
      try {
        const allSessions: Message[][] = JSON.parse(storedSessionsJson).map((session: any[]) =>
          session.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
        if (allSessions.length > 0) {
          setMessages(allSessions[allSessions.length - 1]);
          return;
        }
      } catch (error) {
        console.error('Error parsing sessions from localStorage:', error);
      }
    }
    // If no valid sessions or error, start a new one
    const newInitialMsg = createInitialMessage();
    setMessages([newInitialMsg]);
    localStorage.setItem(ALL_CHATS_KEY, JSON.stringify([[newInitialMsg]]));
  }, []);

  useEffect(() => {
    loadLatestChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load on initial mount

  useEffect(() => {
    // Save current messages to the last session
    if (messages.length > 0) {
      const storedSessionsJson = localStorage.getItem(ALL_CHATS_KEY);
      let allSessions: Message[][] = [];
      if (storedSessionsJson) {
        try {
          allSessions = JSON.parse(storedSessionsJson).map((session: any[]) =>
            session.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp), // Ensure timestamps are Date objects
            }))
          );
        } catch (error) {
          console.error('Error parsing sessions for saving:', error);
          // Potentially corrupted data, might be safer to start fresh or handle error
        }
      }

      if (allSessions.length === 0) {
        // This case should ideally be handled by initial load, but as a fallback:
        allSessions.push(messages);
      } else {
        allSessions[allSessions.length - 1] = messages;
      }
      localStorage.setItem(ALL_CHATS_KEY, JSON.stringify(allSessions));
    }
  }, [messages]);


  const startNewChat = useCallback(() => {
    const newInitialMsg = createInitialMessage();
    const storedSessionsJson = localStorage.getItem(ALL_CHATS_KEY);
    let allSessions: Message[][] = [];
    if (storedSessionsJson) {
      try {
        allSessions = JSON.parse(storedSessionsJson).map((session: any[]) =>
          session.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      } catch (error) {
        console.error('Error parsing sessions for new chat:', error);
      }
    }
    
    // Check if the current last chat is just the initial bot message
    if (allSessions.length > 0) {
        const lastChat = allSessions[allSessions.length - 1];
        if (lastChat.length === 1 && lastChat[0].sender === 'bot' && lastChat[0].text === newInitialMsg.text) {
            // If last chat is just the initial message, replace it instead of adding new
             allSessions[allSessions.length - 1] = [newInitialMsg];
        } else {
            allSessions.push([newInitialMsg]);
        }
    } else {
        allSessions.push([newInitialMsg]);
    }

    localStorage.setItem(ALL_CHATS_KEY, JSON.stringify(allSessions));
    setMessages([newInitialMsg]);
    toast({
      title: "New Chat Started",
      description: "A new conversation has begun.",
    });
  }, [toast]);

  const addMessage = (newMessageOmitIdTimestamp: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...newMessageOmitIdTimestamp,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev.filter(m => !m.isTyping), newMessage]); // Remove typing before adding new
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
    
    const newUserMsg: Message = {
      id: Date.now().toString() + "_user", 
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    // History for AI should be the current messages state, excluding initial bot if it's the only one.
    // And ensure no typing indicators are sent.
    const currentMessagesForHistory = messages.filter(m => !m.isTyping);
    const historyForAI = currentMessagesForHistory.length === 1 && currentMessagesForHistory[0].sender === 'bot'
        ? [] 
        : currentMessagesForHistory;

    setMessages(prev => [...prev.filter(m => !m.isTyping), newUserMsg]); // Add new user message, remove typing
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

        if (actualImageResult.error) {
          console.error('Error generating actual image:', actualImageResult.error);
          let displayErrorMessage = actualImageResult.error;
          let toastTitle = 'Image Generation Failed';
          
          if (actualImageResult.error.includes('Image generation failed to return media')) {
            displayErrorMessage = "The AI couldn't generate an image for this request. Please try a different description or try again later.";
          } else if (actualImageResult.error.startsWith('AI Image Generation Error:')) {
             displayErrorMessage = "There was an issue generating the image. Please try again.";
          }

          addMessage({
            sender: 'bot',
            text: displayErrorMessage,
          });
          toast({
            title: toastTitle,
            description: actualImageResult.error, 
            variant: 'destructive',
          });
        } else if (actualImageResult.imageDataUri) {
          addMessage({
            sender: 'bot',
            text: `Here's the image I generated based on the prompt: "${enhancedPrompt}"`,
            imagePrompt: enhancedPrompt,
            imageUrl: actualImageResult.imageDataUri,
          });
        } else {
           addMessage({ sender: 'bot', text: "Sorry, something went wrong with image generation." });
           toast({ title: 'Image Generation Error', description: 'Unexpected issue during image processing.', variant: 'destructive' });
        }

      } else { // Chat mode
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
      console.error('Error processing message (outer catch):', error);
      removeTypingIndicator();
      
      let displayErrorMessage = 'Sorry, I encountered an error. Please try again.';
      let toastTitle = 'Error';
      let toastDescription = 'Failed to get response from AI.';

      if (error instanceof Error) {
          displayErrorMessage = error.message || displayErrorMessage;
          toastDescription = error.message || toastDescription;
      }
      
      addMessage({
        sender: 'bot',
        text: displayErrorMessage,
      });
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <AnimatedBackground />
      <AppHeader onNewChat={startNewChat} />
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
