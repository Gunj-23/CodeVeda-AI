
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

  const assembledMessages = [];
  if (input.history) {
    const validHistory = input.history.filter(
      (item) =>
        item.role &&
        Array.isArray(item.content) &&
        item.content.length > 0 && 
        item.content.every((c) => typeof c.text === 'string' && c.text.trim() !== '') 
    );
    if (validHistory.length !== input.history.length) {
        console.warn('chatFlow: Some history items were filtered out due to invalid structure or empty text.');
        console.log('Original history length:', input.history.length, 'Valid history length:', validHistory.length);
    }
    assembledMessages.push(...validHistory);
  }

  assembledMessages.push({ role: 'user', content: [{ text: trimmedUserInput }] });

  // Ensure the very first message sent to the AI is from the 'user' role
  let finalMessagesForAI = [...assembledMessages];
  while(finalMessagesForAI.length > 0 && finalMessagesForAI[0].role === 'model') {
    console.log('chatFlow: Removing leading model message from history for AI call:', JSON.stringify(finalMessagesForAI[0]));
    finalMessagesForAI.shift();
  }
  
  // If, after removing leading model messages, finalMessagesForAI is empty,
  // it means the history only contained model messages (e.g., the initial bot greeting) or was empty.
  // The conversation should start with the current user's input.
  if (finalMessagesForAI.length === 0 && trimmedUserInput) {
    console.log('chatFlow: History was only model messages or empty. Starting with current user input for AI.');
    // This re-push is only necessary if `assembledMessages.push({ role: 'user', ... })` was also shifted out,
    // which implies `trimmedUserInput` itself was somehow part of a 'model' leading sequence (not possible here).
    // The primary goal is that `finalMessagesForAI` is not empty and starts with user.
    // If it became empty, it implies only model messages were in `assembledMessages`.
    // The last item pushed to `assembledMessages` was the current user input.
    // So, if `finalMessagesForAI` is empty, it means `assembledMessages` itself must have been empty or only model.
    // Let's simplify: if it's empty after the loop, it *must* be because all prior messages were 'model'.
    // We must ensure the current user input is the first thing if the list is now empty.
    finalMessagesForAI = [{ role: 'user', content: [{ text: trimmedUserInput }] }];

  } else if (finalMessagesForAI.length === 0 && !trimmedUserInput) {
    // This state should ideally be caught by the initial `trimmedUserInput` check.
    console.error('chatFlow: finalMessagesForAI is empty and userInput is also empty. Aborting AI call.');
    return { botResponse: "It looks like your message is empty after processing. Please type something meaningful!" };
  } else if (finalMessagesForAI.length > 0 && finalMessagesForAI[0].role !== 'user') {
    // This is a fallback, should not be reached if logic above is correct
    console.error('chatFlow: CRITICAL - finalMessagesForAI does not start with user after processing. Payload:', JSON.stringify(finalMessagesForAI, null, 2));
    return { botResponse: "AI Flow Error: Conversation structure error. Please try again." };
  }


  console.log('--- Messages being sent to ai.generate (first/last if many) ---');
  if (finalMessagesForAI.length > 0) {
    console.log('First message:', JSON.stringify(finalMessagesForAI[0], null, 2));
    if (finalMessagesForAI.length > 1) {
        console.log(`(... and ${finalMessagesForAI.length - 2} more intermediate messages)`);
        console.log('Last message:', JSON.stringify(finalMessagesForAI[finalMessagesForAI.length - 1], null, 2));
    }
     console.log('Total messages for AI:', finalMessagesForAI.length);
  } else {
    console.log('finalMessagesForAI array is empty before AI call - this should not happen.');
     return { botResponse: "AI Flow Error: No messages to send to AI." };
  }


  try {
    const result = await ai.generate({
      messages: finalMessagesForAI,
    });
    
    const responseText = result.text;

    if (typeof responseText !== 'string' || responseText.trim() === '') { 
      console.error('Genkit Error in chatFlow: AI response text is not a valid string or is empty.');
      console.log('Raw AI result:', JSON.stringify(result, null, 2));
      // Consider returning a more user-friendly message or a default response
      return { botResponse: "The AI's response was empty or invalid. Please try asking differently." };
    }

    return { botResponse: responseText };
  } catch (error: any) {
    console.error("Error in chatFlow during ai.generate or response processing:", error.message || String(error));
    console.error("Full error object in chatFlow:", error);
    const errorMessage = error.message || "An unexpected error occurred with the AI.";
    // Check for specific Gemini API error messages if possible
    if (typeof error.message === 'string' && error.message.includes('[GoogleGenerativeAI Error]')) {
        return { botResponse: `AI Flow Error: ${error.message}. Please try again.` };
    }
    return { botResponse: `AI Flow Error: I had trouble processing that. Please try again.` };
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
