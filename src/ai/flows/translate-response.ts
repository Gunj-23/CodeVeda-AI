'use server';

/**
 * @fileOverview This file contains a Genkit flow for translating bot responses into a user-selected language.
 *
 * - translateResponse - A function that translates the bot's response into the specified language.
 * - TranslateResponseInput - The input type for the translateResponse function.
 * - TranslateResponseOutput - The return type for the translateResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateResponseInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  language: z.string().describe('The target language for translation (e.g., Spanish, French, etc.).'),
});
export type TranslateResponseInput = z.infer<typeof TranslateResponseInputSchema>;

const TranslateResponseOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateResponseOutput = z.infer<typeof TranslateResponseOutputSchema>;

export async function translateResponse(input: TranslateResponseInput): Promise<TranslateResponseOutput> {
  return translateResponseFlow(input);
}

const translatePrompt = ai.definePrompt({
  name: 'translatePrompt',
  input: {schema: TranslateResponseInputSchema},
  output: {schema: TranslateResponseOutputSchema},
  prompt: 'Translate the following text to {{language}}: {{{text}}}',
});

const translateResponseFlow = ai.defineFlow(
  {
    name: 'translateResponseFlow',
    inputSchema: TranslateResponseInputSchema,
    outputSchema: TranslateResponseOutputSchema,
  },
  async input => {
    const {output} = await translatePrompt(input);
    return output!;
  }
);
