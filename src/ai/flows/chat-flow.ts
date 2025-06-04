
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })), // Changed 'parts' to 'content'
});

const ChatFlowInputSchema = z.object({
  userInput: z.string().describe('The latest message from the user.'),
  history: z.array(ChatHistoryItemSchema).optional().describe('The conversation history.'),
});
export type ChatFlowInput = z.infer<typeof ChatFlowInputSchema>;

const ChatFlowOutputSchema = z.object({
  botResponse: z.string().describe('The response from the AI model.'),
});
export type ChatFlowOutput = z.infer<typeof ChatFlowOutputSchema>;

export async function chatFlow(input: ChatFlowInput): Promise<ChatFlowOutput> {
  const contents = [];
  if (input.history) {
    contents.push(...input.history);
  }
  // Changed 'parts' to 'content'
  contents.push({ role: 'user', content: [{ text: input.userInput }] });

  try {
    const result = await ai.generate({
      messages: contents,
    });
    
    const responseText = result.text;

    if (!responseText) {
      console.error('Genkit Error in chatFlow: AI response text is undefined or empty.');
      throw new Error('AI response text is undefined or empty.'); 
    }

    return { botResponse: responseText };
  } catch (error: any) {
    console.error("Error in chatFlow:", error.message || error);
    console.error("Full error object in chatFlow:", error);
    return { botResponse: "AI Flow Error: I had trouble processing that. Please try again." };
  }
}

ai.defineFlow(
  {
    name: 'chatWithBotFlow',
    inputSchema: ChatFlowInputSchema,
    outputSchema: ChatFlowOutputSchema,
  },
  chatFlow
);
