
'use server';
/**
 * @fileOverview A Genkit flow for generating an actual image from a prompt.
 *
 * - generateActualImage - A function that takes an image prompt and returns the image as a data URI.
 * - GenerateActualImageInput - The input type for the generateActualImage function.
 * - GenerateActualImageOutput - The return type for the generateActualImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateActualImageInputSchema = z.object({
  prompt: z.string().describe('The detailed prompt to generate an image from.'),
});
export type GenerateActualImageInput = z.infer<typeof GenerateActualImageInputSchema>;

const GenerateActualImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image as a data URI.'),
});
export type GenerateActualImageOutput = z.infer<typeof GenerateActualImageOutputSchema>;

export async function generateActualImage(input: GenerateActualImageInput): Promise<GenerateActualImageOutput> {
  return generateActualImageFlow(input);
}

const generateActualImageFlow = ai.defineFlow(
  {
    name: 'generateActualImageFlow',
    inputSchema: GenerateActualImageInputSchema,
    outputSchema: GenerateActualImageOutputSchema,
  },
  async (input) => {
    console.log('generateActualImageFlow: Received prompt:', input.prompt);
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', 
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], 
        },
      });

      if (!media || !media.url) {
        console.error('generateActualImageFlow: No media URL returned from AI.');
        throw new Error('Image generation failed to return media.');
      }
      console.log('generateActualImageFlow: Image generated, data URI length:', media.url.length);
      return { imageDataUri: media.url };

    } catch (error: any) {
      console.error('Error in generateActualImageFlow during ai.generate:', error.message || String(error));
      console.error("Full error object in generateActualImageFlow:", error);
      throw new Error(`AI Image Generation Error: ${error.message || 'Failed to generate image.'}`);
    }
  }
);
