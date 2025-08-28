
      "use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Trash2, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SESSIONS_STORAGE_KEY, SESSION_TRASH_STORAGE_KEY } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  name: string;
};

export default function SessionTrashPage() {
  const [trashedSessions, setTrashedSessions] = useState<Session[]>([]);
  const [selectedTrash, setSelectedTrash] = useState<string[]>([]);
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const storedTrash = localStorage.getItem(SESSION_TRASH_STORAGE_KEY);
    if (storedTrash) {
      setTrashedSessions(JSON.parse(storedTrash));
    }
  }, [hydrated]);
  
  const updateAndSaveTrash = (newTrash: Session[]) => {
    setTrashedSessions(newTrash);
    localStorage.setItem(SESSION_TRASH_STORAGE_KEY, JSON.stringify(newTrash));
  };

  const handleRestore = (ids: string[]) => {
    const sessionsToRestore = trashedSessions.filter((session) => ids.includes(session.id));
    const newTrash = trashedSessions.filter((session) => !ids.includes(session.id));
    
    const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const sessions = storedSessions ? JSON.parse(storedSessions) : [];
    const updatedSessions = [...sessions, ...sessionsToRestore];
    
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    
    updateAndSaveTrash(newTrash);
    toast({ title: "Sessions Restored", description: `${ids.length} session(s) have been restored.`});
    setSelectedTrash([]);
  };

  const handleDeletePermanent = (ids: string[]) => {
    const sessionsToDelete = trashedSessions.filter(s => ids.includes(s.id));
    // Permanently delete all associated data for these sessions
    sessionsToDelete.forEach(session => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(session.id)) {
                localStorage.removeItem(key);
            }
        });
    });

    const newTrash = trashedSessions.filter((session) => !ids.includes(session.id));
    updateAndSaveTrash(newTrash);
    
    toast({ variant: "destructive", title: "Sessions Deleted", description: `${ids.length} session(s) have been permanently deleted.`});
    setSelectedTrash([]);
    setDeleteConfirmation('');
  };
  
  const handleSelectTrash = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTrash(prev => [...prev, id]);
    } else {
      setSelectedTrash(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTrash(trashedSessions.map((session) => session.id));
    } else {
      setSelectedTrash([]);
    }
  };

  if (!hydrated) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Session Trash</h1>
      </header>
      
      {trashedSessions.length > 0 && selectedTrash.length > 0 && (
          <Card>
              <CardContent className="pt-6 flex gap-4">
                  <Button onClick={() => handleRestore(selectedTrash)} className="bg-green-500 hover:bg-green-600 text-white"><History className="mr-2 h-4 w-4" /> Restore Selected ({selectedTrash.length})</Button>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive"><ShieldX className="mr-2 h-4 w-4" /> Delete Selected ({selectedTrash.length})</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action will permanently delete {selectedTrash.length} session(s) and all their associated data. This cannot be undone. To confirm, type "DELETE".
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="delete-confirm">Confirmation</Label>
                                <Input
                                    id="delete-confirm"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder='Type "DELETE" to confirm'
                                />
                            </div>
                          <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeletePermanent(selectedTrash)}
                                disabled={deleteConfirmation !== 'DELETE'}
                              >
                                Continue
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </CardContent>
          </Card>
      )}

      {trashedSessions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Deleted Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-nav-trash hover:bg-nav-trash/90">
                     <TableHead className="text-primary-foreground">
                        <Checkbox
                          onCheckedChange={handleSelectAll}
                          checked={selectedTrash.length === trashedSessions.length && trashedSessions.length > 0}
                          aria-label="Select all"
                           className="border-primary-foreground text-primary-foreground"
                        />
                      </TableHead>
                    <TableHead className="text-primary-foreground">Session Name</TableHead>
                    <TableHead className="text-primary-foreground">Session ID</TableHead>
                    <TableHead className="text-right text-primary-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashedSessions.map((session, index) => {
                     const isSelected = selectedTrash.includes(session.id);
                    return (
                    <TableRow key={session.id} data-state={isSelected ? "selected" : "unselected"} className={cn(index % 2 === 0 ? "bg-muted/50" : "bg-background")}>
                       <TableCell>
                          <Checkbox
                            onCheckedChange={(checked) => handleSelectTrash(session.id, !!checked)}
                            checked={isSelected}
                            aria-label={`Select session ${session.name}`}
                          />
                        </TableCell>
                      <TableCell>{session.name}</TableCell>
                      <TableCell className="font-mono text-xs">{session.id}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleRestore([session.id])} className="bg-green-500 hover:bg-green-600 text-white">
                              <History className="mr-2 h-4 w-4" /> Restore
                            </Button>
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmation('')}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action will permanently delete this session and all its data. This cannot be undone. To confirm, type "DELETE".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor={`delete-confirm-${session.id}`}>Confirmation</Label>
                                    <Input
                                        id={`delete-confirm-${session.id}`}
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder='Type "DELETE" to confirm'
                                    />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePermanent([session.id])}
                                    disabled={deleteConfirmation !== 'DELETE'}
                                   >
                                    Continue
                                   </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">The trash is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">Deleted sessions will appear here.</p>
        </div>
      )}
    </div>
  );
}

    