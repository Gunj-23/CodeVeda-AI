'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
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
  const model = ai.getModel('googleai/gemini-2.0-flash'); // Using configured model

  const contents = [];
  if (input.history) {
    contents.push(...input.history);
  }
  contents.push({ role: 'user', parts: [{ text: input.userInput }] });

  try {
    const result = await model.generate({
      messages: contents, // Assuming genkit uses 'messages' or similar for history
       // Or use a specific prompt structure if needed for chat with this model
      // candidates: 1, // Request one candidate
      // Temperature, topK, topP can be configured here if needed
    });
    
    const responseText = result.candidates[0]?.message?.parts[0]?.text;

    if (!responseText) {
      throw new Error('No text in AI response');
    }

    return { botResponse: responseText };
  } catch (error) {
    console.error("Error in chatFlow:", error);
    // Provide a fallback or rethrow
    return { botResponse: "Sorry, I encountered an error. Please try again." };
  }
}

// Define the flow for Genkit tooling (optional but good practice)
ai.defineFlow(
  {
    name: 'chatWithBotFlow',
    inputSchema: ChatFlowInputSchema,
    outputSchema: ChatFlowOutputSchema,
  },
  chatFlow
);
