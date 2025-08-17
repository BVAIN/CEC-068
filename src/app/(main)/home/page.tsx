
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FilePlus, Settings, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { askAi } from "@/ai/flows/conversational-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

export default function HomePage() {
  const [aiPrompt, setAiPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAskAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoading(true);
    
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: aiPrompt }];
    setChatHistory(newHistory);
    setAiPrompt("");

    try {
      const response = await askAi({
          prompt: aiPrompt,
          history: chatHistory.map(m => ({role: m.role, content: m.content}))
      });
      setChatHistory([...newHistory, { role: 'model', content: response }]);
    } catch (error) {
      console.error(error);
      const errorMessage = "Sorry, something went wrong. Please try again.";
      setChatHistory([...newHistory, { role: 'model', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline lg:text-5xl">Welcome to CEC-068</h1>
        <p className="text-lg text-muted-foreground mt-2">Manage your data with ease, online and offline.</p>
      </header>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Ask AI
            </CardTitle>
            <CardDescription>Have a question? Ask our AI assistant for help.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
             {chatHistory.length > 0 && (
                <ScrollArea className="h-60 w-full rounded-md border p-4 space-y-4">
                    {chatHistory.map((message, index) => (
                        <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                             {message.role === 'model' && (
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback>AI</AvatarFallback>
                                </Avatar>
                             )}
                            <div className={`rounded-lg p-3 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            {message.role === 'user' && (
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                </ScrollArea>
            )}
            <Textarea 
              placeholder="Ask anything..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskAi();
                }
              }}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleAskAi} disabled={isLoading || !aiPrompt.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                "Get Answer"
              )}
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePlus className="w-6 h-6 text-primary" />
              Create New Issue
            </CardTitle>
            <CardDescription>Start generating a new issue for a teacher.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p>Go to the Scripts Issue Form page to get started with creating issue records.</p>
          </CardContent>
          <CardFooter>
            <Link href="/issue-form" passHref>
              <Button className="w-full">Go to Issue Packets</Button>
            </Link>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              App Settings
            </CardTitle>
            <CardDescription>Configure your application and integrations.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p>Manage your account settings and connect to services like Google Drive for data synchronization.</p>
          </CardContent>
          <CardFooter>
            <Link href="/settings" passHref>
                <Button className="w-full">Go to Settings</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
