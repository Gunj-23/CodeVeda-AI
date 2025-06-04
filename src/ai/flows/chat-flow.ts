
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
  const contents = [];
  if (input.history) {
    contents.push(...input.history);
  }
  contents.push({ role: 'user', parts: [{ text: input.userInput }] });

  try {
    // Use ai.generate directly. The model from genkit.ts will be used by default.
    const result = await ai.generate({
      messages: contents,
      // Optionally, explicitly specify the model if needed, though default is set in genkit.ts
      // model: 'googleai/gemini-2.0-flash',
    });
    
    // Access the response text using result.text as per Genkit v1.x
    const responseText = result.text;

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
