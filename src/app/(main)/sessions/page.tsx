
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Trash2, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { SESSIONS_STORAGE_KEY, CURRENT_SESSION_KEY } from '@/lib/constants';

type Session = {
  id: string;
  name: string;
};

const sessionFormSchema = z.object({
  name: z.string().min(3, 'Session name must be at least 3 characters long'),
});

export default function SessionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions));
      }
    } catch (error) {
      console.error('Failed to load sessions from localStorage', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load sessions.',
      });
    }
  }, [hydrated, toast]);

  const form = useForm<z.infer<typeof sessionFormSchema>>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: { name: '' },
  });

  const handleSelectSession = (session: Session) => {
    localStorage.setItem(CURRENT_SESSION_KEY, session.id);
    router.push(`/home?session=${session.id}`);
  };

  const handleAddOrUpdateSession = (values: z.infer<typeof sessionFormSchema>) => {
    const { name } = values;
    let updatedSessions;

    if (editingSession) {
      updatedSessions = sessions.map((s) =>
        s.id === editingSession.id ? { ...s, name } : s
      );
      toast({ title: 'Session Updated', description: `Session "${name}" has been updated.` });
    } else {
      const newSession: Session = {
        id: `session_${Date.now()}`,
        name,
      };
      updatedSessions = [...sessions, newSession];
      toast({ title: 'Session Added', description: `Session "${name}" has been created.` });
    }

    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
    setIsDialogOpen(false);
    setEditingSession(null);
    form.reset();
  };

  const handleDeleteSession = (sessionToDelete: Session) => {
    const updatedSessions = sessions.filter((s) => s.id !== sessionToDelete.id);
    
    // Also remove all data associated with that session
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(sessionToDelete.id)) {
            localStorage.removeItem(key);
        }
    });

    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
    toast({
      variant: 'destructive',
      title: 'Session Deleted',
      description: `Session "${sessionToDelete.name}" and all its data have been deleted.`,
    });
  };

  const openEditDialog = (session: Session) => {
    setEditingSession(session);
    form.setValue('name', session.name);
    setIsDialogOpen(true);
  };
  
  if (!hydrated) {
      return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight font-headline">Select a Session</h1>
        </header>

        <main className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Available Sessions</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  if (!open) {
                      setEditingSession(null);
                      form.reset();
                  }
                  setIsDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSession ? 'Edit Session' : 'Add New Session'}</DialogTitle>
                    <DialogDescription>
                      {editingSession ? 'Update the name for this session.' : 'Enter a name for the new session (e.g., "May/June 2025").'}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddOrUpdateSession)}>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Session Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., May/June 2025" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter className='pt-4'>
                        <Button type="submit">{editingSession ? 'Update Session' : 'Add Session'}</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <ul className="space-y-4">
                  {sessions.map((session) => (
                    <li
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => handleSelectSession(session)}
                        className="flex-grow text-left"
                      >
                         <span className="text-lg font-medium">{session.name}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(session)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSession(session)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No sessions found.</p>
                  <p>Click "Add New Session" to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
