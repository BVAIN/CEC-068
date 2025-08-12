
'use server';
/**
 * @fileOverview A flow for sending emails.
 *
 * IMPORTANT: This is a placeholder for a real email sending implementation.
 * The current code only logs the email details to the console and DOES NOT actually send an email.
 * To enable email sending, you must integrate a real email service like Resend, SendGrid, or Nodemailer
 * within the 'sendEmailFlow' below.
 *
 * - sendEmail - A function that handles sending an email.
 * - SendEmailInput - The input type for the sendEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendEmailInputSchema = z.object({
  to: z.string().email().describe('The email address of the recipient.'),
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The HTML body of the email.'),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;


export async function sendEmail(input: SendEmailInput): Promise<void> {
    // This function calls the Genkit flow to handle the email logic.
    // The current implementation is a placeholder.
    console.log(`Email sending function called for: ${input.to}`);
    console.log(`Subject: ${input.subject}`);
    await sendEmailFlow(input);
}


const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    // DEVELOPER ACTION REQUIRED:
    // This is a placeholder and does NOT actually send an email.
    // To implement email sending, replace the console logs below with an integration
    // for a real email service provider.
    //
    // Example using Resend (you would need to `npm install resend`):
    //
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    //
    // await resend.emails.send({
    //   from: 'onboarding@resend.dev', // Your verified sending address
    //   to: input.to,
    //   subject: input.subject,
    //   html: input.body,
    // });

    console.log(`--- PLACEHOLDER: Pretending to send email ---`);
    console.log(`To: ${input.to}`);
    console.log(`Subject: ${input.subject}`);
    console.log(`Body: ${input.body}`);
    console.log(`-------------------------------------------`);
    console.log("REMINDER: This is a log message. No email was actually sent.");
  }
);
