
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
  return conversationalFlow(prompt ?? '');
}

const conversationalFlow = ai.defineFlow(
  {
    name: 'conversationalFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    // This check prevents the flow from crashing if it somehow receives an empty or null prompt.
    if (!prompt || prompt.trim() === '') {
        return "Please provide a prompt.";
    }
    const {output} = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: prompt,
    });
    // The 'output' can be null if the model returns no content, so we safeguard against that.
    return output ?? "Sorry, I couldn't generate a response. Please try again.";
  }
);
