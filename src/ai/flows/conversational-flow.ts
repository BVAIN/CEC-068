
'use server';
/**
 * @fileOverview A general-purpose conversational AI flow.
 *
 * - askAi - A function that takes a user's prompt and returns a response from the AI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {Message, Role} from 'genkit/model';

const ConversationalInputSchema = z.object({
  prompt: z.string(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ),
});
export type ConversationalInput = z.infer<typeof ConversationalInputSchema>;


export async function askAi(input: ConversationalInput): Promise<string> {
  return conversationalFlow(input);
}

const conversationalFlow = ai.defineFlow(
  {
    name: 'conversationalFlow',
    inputSchema: ConversationalInputSchema,
    outputSchema: z.string(),
  },
  async ({prompt, history}) => {
    if (!prompt || prompt.trim() === '') {
        return "Please provide a prompt.";
    }

    const systemPrompt = `You are an expert AI assistant for the 'DriveSync Notes' application. Your purpose is to help users understand and use the app's features, which include:
    - User Authentication: Login and password management.
    - Navigation: A sidebar with Home, Issue Packets, Bill Form, Theme, Trash, and Settings.
    - Issue Packets: Creating and managing script packet issues for teachers, stored locally and synced to Google Drive.
    - Bill Form: Managing bills, also synced.
    - Google Drive Integration: For data backup and sync.
    - Theme Selection: Light, Dark, and System modes.
    - Offline Support: Through local storage.
    
    Be concise, helpful, and friendly. Answer questions about the application's functionality. If asked about a topic outside the app, politely decline.`;

    const messages = history.map(msg => ({
        role: msg.role as Role,
        content: [{text: msg.content}]
    }));

    const {output} = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      system: systemPrompt,
      history: messages,
      prompt: prompt,
    });
    
    return output ?? "Sorry, I couldn't generate a response. Please try again.";
  }
);
