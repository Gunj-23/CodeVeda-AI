'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating image creation prompts from text descriptions.
 *
 * - generateImagePrompt - A function that takes a text description and returns an image creation prompt.
 * - GenerateImagePromptInput - The input type for the generateImagePrompt function.
 * - GenerateImagePromptOutput - The return type for the generateImagePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImagePromptInputSchema = z.object({
  textDescription: z
    .string()
    .describe('The text description to generate an image creation prompt from.'),
});
export type GenerateImagePromptInput = z.infer<typeof GenerateImagePromptInputSchema>;

const GenerateImagePromptOutputSchema = z.object({
  imagePrompt: z
    .string()
    .describe('The generated image creation prompt based on the text description.'),
});
export type GenerateImagePromptOutput = z.infer<typeof GenerateImagePromptOutputSchema>;

export async function generateImagePrompt(input: GenerateImagePromptInput): Promise<GenerateImagePromptOutput> {
  return generateImagePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImagePromptPrompt',
  input: {schema: GenerateImagePromptInputSchema},
  output: {schema: GenerateImagePromptOutputSchema},
  prompt: `You are an AI assistant specializing in generating image creation prompts. Based on the user's description, create a detailed and imaginative prompt suitable for an AI image generation model.

User Description: {{{textDescription}}}

Image Creation Prompt:`,
});

const generateImagePromptFlow = ai.defineFlow(
  {
    name: 'generateImagePromptFlow',
    inputSchema: GenerateImagePromptInputSchema,
    outputSchema: GenerateImagePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
