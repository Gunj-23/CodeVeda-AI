
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
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
  console.log('--- chatFlow Invoked ---');
  console.log('User Input Received:', JSON.stringify(input.userInput));
  console.log('History Received:', input.history ? JSON.stringify(input.history.length) + ' items' : 'No history');

  const trimmedUserInput = input.userInput.trim();

  if (!trimmedUserInput) {
    console.warn('chatFlow: User input is empty after trimming. Returning a default message.');
    return { botResponse: "It looks like your message is empty. Please type something for me to respond to!" };
  }

  const contents = [];
  if (input.history) {
    const validHistory = input.history.filter(
      (item) =>
        item.role &&
        Array.isArray(item.content) &&
        item.content.length > 0 && // Ensure content array is not empty
        item.content.every((c) => typeof c.text === 'string' && c.text.trim() !== '') // Ensure text is a non-empty string
    );
    if (validHistory.length !== input.history.length) {
        console.warn('chatFlow: Some history items were filtered out due to invalid structure or empty text.');
        console.log('Original history length:', input.history.length, 'Valid history length:', validHistory.length);
    }
    contents.push(...validHistory);
  }

  contents.push({ role: 'user', content: [{ text: trimmedUserInput }] });

  console.log('--- Contents being sent to ai.generate (first item if many) ---');
  if (contents.length > 0) {
    console.log(JSON.stringify(contents[0], null, 2));
    if (contents.length > 1) {
        console.log(`(... and ${contents.length -1} more items)`);
        console.log('Last item (user input):', JSON.stringify(contents[contents.length - 1], null, 2));
    }
  } else {
    console.log('Contents array is empty.');
  }


  try {
    console.log('Attempting ai.generate with model:', ai.getModel().name); // Log default model
    const result = await ai.generate({
      messages: contents,
    });
    
    const responseText = result.text;

    if (typeof responseText !== 'string' || responseText.trim() === '') { // Check if string and not empty
      console.error('Genkit Error in chatFlow: AI response text is not a valid string or is empty.');
      console.log('Raw AI result:', JSON.stringify(result, null, 2));
      // It's better to throw an error that gets caught by the calling action/page
      // than to return a generic error message directly as botResponse here.
      throw new Error('AI response text is undefined, not a string, or empty.');
    }

    return { botResponse: responseText };
  } catch (error: any) {
    console.error("Error in chatFlow during ai.generate or response processing:", error.message || String(error));
    console.error("Full error object in chatFlow:", error);
    // Propagate a more specific error or the original error message if possible
    const errorMessage = error.message || "An unexpected error occurred in the AI flow.";
    return { botResponse: `AI Flow Error: ${errorMessage}. Please try again.` };
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
