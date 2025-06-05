
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

const CHAT_MESSAGES_KEY = 'chatMessages';

export default function HomePage() {
  const { toast } = useToast();

  const initialMessageRef = useRef<Message>({
    id: 'initial-bot-message',
    text: "Welcome to CodeVeda AI! I'm your futuristic AI assistant. How can I help you today?",
    sender: 'bot',
    timestamp: new Date(),
  });

  const [messages, setMessages] = useState<Message[]>([initialMessageRef.current]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedMessagesJson = localStorage.getItem(CHAT_MESSAGES_KEY);
    if (storedMessagesJson) {
      try {
        const parsedMessages: Message[] = JSON.parse(storedMessagesJson).map(
          (msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp), 
          })
        );
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages);
        } else {
          setMessages([initialMessageRef.current]); 
        }
      } catch (error) {
        console.error('Error parsing messages from localStorage:', error);
        setMessages([initialMessageRef.current]); 
      }
    } else {
      setMessages([initialMessageRef.current]); 
    }
  }, []); 

  useEffect(() => {
    if (messages.length === 1 && messages[0].id === initialMessageRef.current.id) {
      const storedJson = localStorage.getItem(CHAT_MESSAGES_KEY);
      let isStoredJsonEffectivelyEmpty = !storedJson; 

      if (storedJson) {
        try {
          const parsed = JSON.parse(storedJson);
          if (Array.isArray(parsed) && parsed.length === 0) {
            isStoredJsonEffectivelyEmpty = true; 
          }
        } catch (e) {
          console.warn("Could not parse localStorage for save check, considering it non-empty for save.", e);
        }
      }

      if (isStoredJsonEffectivelyEmpty) {
        return;
      }
    }

    if (messages.length > 0) {
      localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
    } else {
      localStorage.removeItem(CHAT_MESSAGES_KEY);
    }
  }, [messages]);


  const startNewChat = () => {
    localStorage.removeItem(CHAT_MESSAGES_KEY); 
    setMessages([initialMessageRef.current]);   
    toast({
      title: "New Chat Started",
      description: "The conversation has been cleared.",
    });
  };

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
    
    const newUserMsg: Message = {
      id: Date.now().toString() + "_user", 
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    const historyForAI = messages.filter(m => !m.isTyping && m.id !== initialMessageRef.current.id || (m.id === initialMessageRef.current.id && messages.length > 1));

    setMessages(prev => [...prev, newUserMsg]);
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
            description: actualImageResult.error, // Show the specific AI error from the result
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
           // Fallback if neither error nor imageDataUri is present (should not happen with new flow logic)
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
    } catch (error) { // This catch block now primarily handles errors from chatFlow, translateTextAction, or generateImageQueryAction
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
