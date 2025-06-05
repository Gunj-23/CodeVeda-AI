
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/common/animated-background';
import AppHeader from '@/components/layout/app-header';
import ChatWindow from '@/components/chat/chat-window';
import ChatInputArea from '@/components/chat/chat-input-area';
import type { Message, ChatSession, LanguageOption } from '@/types';
import { LANGUAGES } from '@/types';
import { getChatResponseAction, translateTextAction, generateImageQueryAction, generateActualImageAction } from './actions';
import { useToast } from '@/hooks/use-toast';

const ALL_CHATS_KEY = 'codeVedaAllChats'; // Stores ChatSession[]

const createInitialMessage = (): Message => ({
  id: Date.now().toString() + '_initial_bot',
  text: "Welcome to CodeVeda AI! I'm your futuristic AI assistant. How can I help you today?",
  sender: 'bot',
  timestamp: new Date(),
});

const createNewSession = (title?: string): ChatSession => {
  const newId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id: newId,
    title: title || `Chat from ${new Date().toLocaleString()}`,
    messages: [createInitialMessage()],
    lastModified: new Date(),
  };
};

function HomePageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const saveAllSessions = useCallback((sessionsToSave: ChatSession[]) => {
    localStorage.setItem(ALL_CHATS_KEY, JSON.stringify(sessionsToSave));
    setAllSessions(sessionsToSave);
  }, []);

  const loadSessionsAndSetActive = useCallback(() => {
    const storedSessionsJson = localStorage.getItem(ALL_CHATS_KEY);
    let loadedSessions: ChatSession[] = [];

    if (storedSessionsJson) {
      try {
        const rawSessions = JSON.parse(storedSessionsJson);
        // Migration from old format (Message[][]) to new format (ChatSession[])
        if (rawSessions.length > 0 && Array.isArray(rawSessions[0]) && !rawSessions[0].id) {
          loadedSessions = rawSessions.map((sessionMessages: any[], index: number) => {
            const firstMsg = sessionMessages[0];
            const newId = `migrated-${Date.now()}-${index}`;
            return {
              id: newId,
              title: `Migrated Chat ${index + 1} - ${firstMsg ? new Date(firstMsg.timestamp).toLocaleDateString() : new Date().toLocaleDateString()}`,
              messages: sessionMessages.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) })),
              lastModified: firstMsg ? new Date(firstMsg.timestamp) : new Date(),
            };
          });
          saveAllSessions(loadedSessions); // Save migrated sessions
        } else if (rawSessions.length > 0 && rawSessions[0].id) {
          // Already new format
          loadedSessions = rawSessions.map((session: any) => ({
            ...session,
            messages: session.messages.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) })),
            lastModified: new Date(session.lastModified),
          }));
        }
      } catch (error) {
        console.error('Error parsing or migrating sessions from localStorage:', error);
        loadedSessions = []; // Start fresh if error
      }
    }

    setAllSessions(loadedSessions); // Update state even if empty

    const sessionIdFromQuery = searchParams.get('sessionId');
    let sessionToActivate: ChatSession | undefined = undefined;

    if (sessionIdFromQuery) {
      sessionToActivate = loadedSessions.find(s => s.id === sessionIdFromQuery);
      if (sessionToActivate) {
         router.replace('/', undefined); // Clear query param after loading
      } else {
        toast({ title: "Session Not Found", description: "The requested chat session could not be found. Loading the latest or a new chat.", variant: "destructive"});
      }
    }

    if (!sessionToActivate && loadedSessions.length > 0) {
      // Load the most recently modified session
      sessionToActivate = [...loadedSessions].sort((a,b) => b.lastModified.getTime() - a.lastModified.getTime())[0];
    }
    
    if (sessionToActivate) {
      setActiveSessionId(sessionToActivate.id);
      setMessages(sessionToActivate.messages);
    } else {
      // No sessions found, or specific session not found, start a new one
      const newSession = createNewSession();
      saveAllSessions([newSession]); // Save it as the first session
      setActiveSessionId(newSession.id);
      setMessages(newSession.messages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveAllSessions, searchParams, toast]); // router intentionally omitted to prevent re-runs on nav

  useEffect(() => {
    loadSessionsAndSetActive();
  }, [loadSessionsAndSetActive]); // Ran once on mount


  useEffect(() => {
    if (messages.length > 0 && activeSessionId) {
      const updatedSessions = allSessions.map(session =>
        session.id === activeSessionId
          ? { ...session, messages: messages, lastModified: new Date() }
          : session
      );
      // Check if active session was found and updated; if not, it might be a new session not yet in allSessions
      const activeSessionExists = updatedSessions.some(s => s.id === activeSessionId);
      if (!activeSessionExists) {
          // This case should be rare if activeSessionId is always set from existing/newly created sessions
          // For safety, find it or create a new one if truly missing
          let currentActiveSession = allSessions.find(s => s.id === activeSessionId);
          if (!currentActiveSession) {
              // This implies a disconnect, perhaps page.tsx created a session that wasn't immediately pushed to allSessions
              // Let's assume messages belong to a new session that needs to be added (though startNewChat should handle this)
              console.warn("Attempted to save messages for an activeSessionId not in allSessions. This might indicate an issue.");
              // Avoid adding duplicates if messages is just the initial message
              if (!(messages.length === 1 && messages[0].text === createInitialMessage().text)) {
                 const tempNewSession: ChatSession = {id: activeSessionId, title: `Chat ${new Date().toLocaleTimeString()}`, messages: messages, lastModified: new Date() };
                 saveAllSessions([...allSessions, tempNewSession]);
              }
          }
      } else {
          saveAllSessions(updatedSessions);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeSessionId]); // saveAllSessions dependency removed to avoid loop with its own setAllSessions


  const startNewChat = useCallback(() => {
    const newSession = createNewSession();
    const updatedSessions = [...allSessions, newSession];
    saveAllSessions(updatedSessions);
    setActiveSessionId(newSession.id);
    setMessages(newSession.messages); // Set UI to the new session's initial messages
    toast({
      title: "New Chat Started",
      description: "A new conversation has begun.",
    });
  }, [allSessions, saveAllSessions, toast]);

  const addMessage = (newMessageOmitIdTimestamp: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...newMessageOmitIdTimestamp,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev.filter(m => !m.isTyping), newMessage]);
  };

  const addTypingIndicator = () => {
    const typingMessage: Message = {
      id: 'typing-indicator', text: '', sender: 'bot', timestamp: new Date(), isTyping: true,
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
      id: Date.now().toString() + "_user", text: userMessageText, sender: 'user', timestamp: new Date(),
    };
    
    const currentMessagesForHistory = messages.filter(m => !m.isTyping);
    const historyForAI = currentMessagesForHistory.length === 1 && currentMessagesForHistory[0].sender === 'bot' && currentMessagesForHistory[0].id.includes('_initial_bot')
        ? [] 
        : currentMessagesForHistory;

    setMessages(prev => [...prev.filter(m => !m.isTyping), newUserMsg]);
    setIsLoading(true);
    addTypingIndicator();

    try {
      if (isImageMode) {
        const imagePromptResult = await generateImageQueryAction(userMessageText);
        const enhancedPrompt = imagePromptResult.imagePrompt;

        if (!enhancedPrompt) {
            removeTypingIndicator();
            addMessage({ sender: 'bot', text: "Sorry, I couldn't come up with an image prompt for that." });
            toast({ title: 'Image Prompt Failed', variant: 'destructive' });
            setIsLoading(false);
            return;
        }

        const actualImageResult = await generateActualImageAction(enhancedPrompt);
        removeTypingIndicator();

        if (actualImageResult.error) {
          let displayErrorMessage = actualImageResult.error;
          if (actualImageResult.error.includes('Image generation failed to return media')) {
            displayErrorMessage = "The AI couldn't generate an image. Try a different description or try again.";
          } else if (actualImageResult.error.startsWith('AI Image Generation Error:')) {
             displayErrorMessage = "Issue generating image. Please try again.";
          }
          addMessage({ sender: 'bot', text: displayErrorMessage });
          toast({ title: 'Image Generation Failed', description: actualImageResult.error, variant: 'destructive' });
        } else if (actualImageResult.imageDataUri) {
          addMessage({ sender: 'bot', text: `Here's the image for: "${enhancedPrompt}"`, imagePrompt: enhancedPrompt, imageUrl: actualImageResult.imageDataUri });
        } else {
           addMessage({ sender: 'bot', text: "Sorry, image generation encountered an issue." });
           toast({ title: 'Image Generation Error', variant: 'destructive' });
        }

      } else { // Chat mode
        const chatResponse = await getChatResponseAction(userMessageText, historyForAI);
        let botText = chatResponse.botResponse;
        let originalTextForBot, translatedTextForBot;

        if (language && language !== 'en' && botText) {
          originalTextForBot = botText;
          try {
            const translationResult = await translateTextAction(botText, language);
            if(translationResult.translatedText) botText = translationResult.translatedText;
            translatedTextForBot = translationResult.translatedText;
          } catch (translateError) {
            console.error('Translation error:', translateError);
            toast({ title: 'Translation Failed', variant: 'destructive' });
          }
        }
        removeTypingIndicator();
        addMessage({ sender: 'bot', text: botText, originalText: originalTextForBot, translatedText: translatedTextForBot });
      }
    } catch (error: any) { 
      removeTypingIndicator();
      let displayErrorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
      addMessage({ sender: 'bot', text: displayErrorMessage });
      toast({ title: 'Error', description: displayErrorMessage, variant: 'destructive' });
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


export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
