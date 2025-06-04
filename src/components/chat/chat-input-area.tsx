'use client';

import React, { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Mic, ImageIcon, Languages, Settings, Image as ImageIconLucide } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { LanguageOption } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';

interface ChatInputAreaProps {
  onSendMessage: (text: string, isImageMode: boolean, language: string | null) => void;
  isLoading: boolean;
  languages: LanguageOption[];
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({ onSendMessage, isLoading, languages }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Default language

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        // Optional: auto-send after voice input
        // handleSubmit(new Event('submit') as unknown as FormEvent<HTMLFormElement>, transcript);
      };
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({ title: "Voice Input Error", description: event.error === 'no-speech' ? "No speech detected." : event.error === 'audio-capture' ? "Microphone not available." : "An error occurred during speech recognition.", variant: "destructive"});
        setIsListening(false);
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({ title: "Voice Input Not Supported", description: "Your browser doesn't support speech recognition.", variant: "destructive"});
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.lang = selectedLanguage || 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({ title: "Voice Input Error", description: "Could not start voice recognition. Please check microphone permissions.", variant: "destructive"});
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e?: FormEvent<HTMLFormElement>, voiceInput?: string) => {
    if (e) e.preventDefault();
    const textToSend = voiceInput || inputValue;
    if (textToSend.trim() || isImageMode) { // Allow empty input for image mode if that's desired
      onSendMessage(textToSend.trim(), isImageMode, selectedLanguage);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 glassmorphic rounded-lg shadow-lg flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          placeholder={isImageMode ? "Describe image to generate..." : "Type your message..."}
          className="flex-grow bg-input/50 border-border focus:ring-ring text-base"
          disabled={isLoading || isListening}
        />
        <Button type="button" variant="ghost" size="icon" onClick={handleMicClick} disabled={isLoading} aria-label="Use microphone"
          className={`${isListening ? 'text-primary neon-text-primary' : 'hover:text-accent neon-text-accent'} transition-all`}>
          <Mic className={isListening ? `animate-pulse` : ``} />
        </Button>
        <Button type="submit" variant="default" size="icon" disabled={isLoading || (!inputValue.trim() && !isImageMode)} aria-label="Send message"
         className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow-primary">
          <Send className="text-primary-foreground" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center space-x-2">
            <Switch
              id="image-mode"
              checked={isImageMode}
              onCheckedChange={setIsImageMode}
              disabled={isLoading}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=unchecked]:border-border data-[state=checked]:shadow-[0_0_8px_hsl(var(--primary))]"
            />
            <Label htmlFor="image-mode" className="flex items-center gap-1 text-sm neon-text-primary cursor-pointer">
              <ImageIconLucide size={16} className="mr-1" /> Image Mode
            </Label>
        </div>

        <div className="flex items-center">
          <Languages size={18} className="mr-2 neon-text-accent"/>
          <Select
            value={selectedLanguage || ''}
            onValueChange={(value) => setSelectedLanguage(value === 'none' ? null : value)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px] bg-input/50 border-border focus:ring-ring text-sm">
              <SelectValue placeholder="Translate Reply..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="none" className="text-sm">No Translation</SelectItem>
              {languages.map(lang => (
                <SelectItem key={lang.value} value={lang.value} className="text-sm">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </form>
  );
};

export default ChatInputArea;
