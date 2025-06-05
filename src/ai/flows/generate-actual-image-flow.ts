
'use server';
/**
 * @fileOverview A Genkit flow for generating an actual image from a prompt.
 *
 * - generateActualImage - A function that takes an image prompt and returns the image as a data URI or an error.
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
  imageDataUri: z.string().optional().describe('The generated image as a data URI.'),
  error: z.string().optional().describe('An error message if image generation failed.'),
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
  async (input): Promise<GenerateActualImageOutput> => {
    console.log('generateActualImageFlow: Received prompt:', input.prompt);
    try {
      const result = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      console.log('generateActualImageFlow: Full AI result:', JSON.stringify(result, null, 2));

      const media = result.media;

      if (!media || !media.url) {
        console.error('generateActualImageFlow: No media URL returned from AI. Text response from AI (if any):', result.text);
        return { error: 'AI Image Generation Error: Image generation failed to return media.' };
      }
      console.log('generateActualImageFlow: Image generated, data URI length:', media.url.length);
      return { imageDataUri: media.url };

    } catch (error: any) {
      console.error('Error in generateActualImageFlow during ai.generate or processing:', error.message || String(error));
      console.error("Full error object in generateActualImageFlow:", error);
      if (error.cause && typeof error.cause === 'object') {
        console.error("Error cause:", JSON.stringify(error.cause, null, 2));
      }
      
      let originalErrorMessage = 'Failed to generate image.';
      if (error.message) {
        originalErrorMessage = error.message;
      }
      // Instead of throwing, return an error object
      return { error: `AI Image Generation Error: ${originalErrorMessage}` };
    }
  }
);
