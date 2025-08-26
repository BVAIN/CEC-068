
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Trash2, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { IssueFormValues } from "../../issue-form/page";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ISSUES_STORAGE_KEY, TRASH_STORAGE_KEY } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";


export default function IssueTrashPage() {
  const [trashedIssues, setTrashedIssues] = useState<IssueFormValues[]>([]);
  const [selectedTrash, setSelectedTrash] = useState<string[]>([]);
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const storedTrash = localStorage.getItem(TRASH_STORAGE_KEY);
    if (storedTrash) {
      setTrashedIssues(JSON.parse(storedTrash));
    }
  }, []);
  
  const updateAndSaveTrash = (newTrash: IssueFormValues[]) => {
    setTrashedIssues(newTrash);
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(newTrash));
  };

  const handleRestore = (ids: string[]) => {
    const issuesToRestore = trashedIssues.filter((issue) => ids.includes(issue.id!));
    const newTrash = trashedIssues.filter((issue) => !ids.includes(issue.id!));
    
    const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
    const issues = storedIssues ? JSON.parse(storedIssues) : [];
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify([...issues, ...issuesToRestore]));
    
    updateAndSaveTrash(newTrash);
    toast({ title: "Issues Restored", description: `${ids.length} issue(s) have been restored.`});
    setSelectedTrash([]);
  };

  const handleDeletePermanent = (ids: string[]) => {
    const newTrash = trashedIssues.filter((issue) => !ids.includes(issue.id!));
    updateAndSaveTrash(newTrash);
    const count = ids.length;
    toast({ variant: "destructive", title: "Issues Deleted", description: `${count} issue(s) have been permanently deleted.`});
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
      setSelectedTrash(trashedIssues.map((issue) => issue.id!));
    } else {
      setSelectedTrash([]);
    }
  };
  
  if (!hydrated) {
    return null; // or a loading skeleton
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Issue Trash</h1>
      </header>
      
      {trashedIssues.length > 0 && selectedTrash.length > 0 && (
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
                                  This action will permanently delete {selectedTrash.length} issue(s). This cannot be undone. To confirm, type "DELETE".
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

      {trashedIssues.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Deleted Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-nav-issue hover:bg-nav-issue/90">
                     <TableHead className="text-primary-foreground">
                        <Checkbox
                          onCheckedChange={handleSelectAll}
                          checked={selectedTrash.length === trashedIssues.length && trashedIssues.length > 0}
                          aria-label="Select all"
                          className="border-primary-foreground text-primary-foreground"
                        />
                      </TableHead>
                    <TableHead className="text-primary-foreground">Teacher Name</TableHead>
                    <TableHead className="text-primary-foreground">Teacher ID</TableHead>
                    <TableHead className="text-primary-foreground">Course</TableHead>
                    <TableHead className="text-primary-foreground">Campus</TableHead>
                    <TableHead className="text-primary-foreground">Type</TableHead>
                    <TableHead className="text-primary-foreground">Date of Issue</TableHead>
                    <TableHead className="text-primary-foreground">Packet No.</TableHead>
                    <TableHead className="text-right text-primary-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashedIssues.map((issue, index) => {
                     const isSelected = selectedTrash.includes(issue.id!);
                    return (
                    <TableRow key={issue.id} data-state={isSelected ? "selected" : "unselected"} className={cn(index % 2 === 0 ? "bg-muted/50" : "bg-background")}>
                       <TableCell>
                          <Checkbox
                            onCheckedChange={(checked) => issue.id && handleSelectTrash(issue.id, !!checked)}
                            checked={isSelected}
                            aria-label={`Select row for ${issue.teacherName}`}
                          />
                        </TableCell>
                      <TableCell>{issue.teacherName}</TableCell>
                      <TableCell>{issue.teacherId}</TableCell>
                      <TableCell>{issue.course}</TableCell>
                      <TableCell>{issue.campus}</TableCell>
                      <TableCell>{issue.schoolType}</TableCell>
                      <TableCell>{issue.dateOfIssue}</TableCell>
                      <TableCell>{issue.packetNo}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleRestore([issue.id!])} className="bg-green-500 hover:bg-green-600 text-white">
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
                                    This action will permanently delete this issue. This cannot be undone. To confirm, type "DELETE".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor={`delete-confirm-${issue.id}`}>Confirmation</Label>
                                    <Input
                                        id={`delete-confirm-${issue.id}`}
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder='Type "DELETE" to confirm'
                                    />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePermanent([issue.id!])}
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
          <p className="mt-1 text-sm text-muted-foreground">Deleted issues will appear here.</p>
        </div>
      )}
    </div>
  );
}
