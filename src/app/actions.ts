
'use server';

import { chatFlow, type ChatFlowInput, type ChatFlowOutput } from '@/ai/flows/chat-flow';
import { translateResponse, type TranslateResponseInput, type TranslateResponseOutput } from '@/ai/flows/translate-response';
import { generateImagePrompt, type GenerateImagePromptInput, type GenerateImagePromptOutput } from '@/ai/flows/generate-image-prompt';
import type { Message } from '@/types';

export async function getChatResponseAction(
  userInput: string,
  history: Message[]
): Promise<ChatFlowOutput> {
  const formattedHistory = history.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    content: [{ text: msg.text }], // Changed 'parts' to 'content'
  }));

  const input: ChatFlowInput = {
    userInput,
    history: formattedHistory,
  };
  return chatFlow(input);
}

export async function translateTextAction(
  text: string,
  language: string
): Promise<TranslateResponseOutput> {
  const input: TranslateResponseInput = { text, language };
  return translateResponse(input);
}

export async function generateImageQueryAction(
  description: string
): Promise<GenerateImagePromptOutput> {
  const input: GenerateImagePromptInput = { textDescription: description };
  return generateImagePrompt(input);
}
