
'use server';
/**
 * @fileOverview A general-purpose conversational AI flow.
 *
 * - askAi - A function that takes a user's prompt and returns a response from the AI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export async function askAi(prompt: string): Promise<string> {
  // Ensure we don't pass null to the flow, which expects a string.
  return conversationalFlow(prompt || '');
}

const conversationalFlow = ai.defineFlow(
  {
    name: 'conversationalFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    if (!prompt) {
        return "Please provide a prompt.";
    }
    const {output} = await ai.generate({
      prompt: prompt,
    });
    return output!;
  }
);
