import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/theme-provider';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'CEC-068',
  description: 'Manage your data with ease, online and offline.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider storageKey="drivesync-theme">
            {children}
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
