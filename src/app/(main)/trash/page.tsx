
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Trash2, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { IssueFormValues } from "../issue-form/page";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ISSUES_STORAGE_KEY, TRASH_STORAGE_KEY } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function TrashPage() {
  const [trashedIssues, setTrashedIssues] = useState<IssueFormValues[]>([]);
  const [selectedTrash, setSelectedTrash] = useState<number[]>([]);
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    const storedTrash = localStorage.getItem(TRASH_STORAGE_KEY);
    if (storedTrash) {
      setTrashedIssues(JSON.parse(storedTrash));
    }
  }, []);
  
  const updateAndSaveTrash = (newTrash: IssueFormValues[]) => {
    setTrashedIssues(newTrash);
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(newTrash));
  };

  const handleRestore = (index: number) => {
    const issueToRestore = trashedIssues[index];
    const newTrash = trashedIssues.filter((_, i) => i !== index);
    updateAndSaveTrash(newTrash);

    const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
    const issues = storedIssues ? JSON.parse(storedIssues) : [];
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify([...issues, issueToRestore]));
    toast({ title: "Issue Restored", description: "The issue has been restored successfully." });
  };
  
  const handleDeletePermanent = (index: number) => {
    const newTrash = trashedIssues.filter((_, i) => i !== index);
    updateAndSaveTrash(newTrash);
    toast({ variant: "destructive", title: "Issue Deleted", description: "The issue has been permanently deleted." });
  };
  
  const handleSelectTrash = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedTrash(prev => [...prev, index]);
    } else {
      setSelectedTrash(prev => prev.filter(i => i !== index));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTrash(trashedIssues.map((_, index) => index));
    } else {
      setSelectedTrash([]);
    }
  };

  const handleBulkRestore = () => {
    const issuesToRestore = trashedIssues.filter((_, index) => selectedTrash.includes(index));
    const newTrash = trashedIssues.filter((_, index) => !selectedTrash.includes(index));
    
    const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
    const issues = storedIssues ? JSON.parse(storedIssues) : [];
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify([...issues, ...issuesToRestore]));
    
    updateAndSaveTrash(newTrash);
    toast({ title: "Issues Restored", description: `${selectedTrash.length} issue(s) have been restored.`});
    setSelectedTrash([]);
  };

  const handleBulkDelete = () => {
    const newTrash = trashedIssues.filter((_, index) => !selectedTrash.includes(index));
    updateAndSaveTrash(newTrash);
    const count = selectedTrash.length;
    toast({ variant: "destructive", title: "Issues Deleted", description: `${count} issue(s) have been permanently deleted.`});
    setSelectedTrash([]);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Trash</h1>
        <p className="text-lg text-muted-foreground mt-2">View and manage deleted issues.</p>
      </header>
      
      {trashedIssues.length > 0 && selectedTrash.length > 0 && (
          <Card>
              <CardContent className="pt-6 flex gap-4">
                  <Button onClick={handleBulkRestore}><History className="mr-2 h-4 w-4" /> Restore Selected ({selectedTrash.length})</Button>
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
                                onClick={() => {
                                    handleBulkDelete();
                                    setDeleteConfirmation('');
                                }}
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
            <CardDescription>Here are the issues you have deleted. You can restore them or delete them permanently.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>
                        <Checkbox
                          onCheckedChange={handleSelectAll}
                          checked={selectedTrash.length === trashedIssues.length && trashedIssues.length > 0}
                          aria-label="Select all"
                        />
                      </TableHead>
                    <TableHead>Teacher Name</TableHead>
                    <TableHead>Teacher ID</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date of Issue</TableHead>
                    <TableHead>Packet No.</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashedIssues.map((issue, index) => {
                     const isSelected = selectedTrash.includes(index);
                    return (
                    <TableRow key={index} data-state={isSelected ? "selected" : "unselected"}>
                       <TableCell>
                          <Checkbox
                            onCheckedChange={(checked) => handleSelectTrash(index, !!checked)}
                            checked={isSelected}
                            aria-label={`Select row ${index + 1}`}
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
                            <Button variant="outline" size="sm" onClick={() => handleRestore(index)}>
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
                                    <Label htmlFor={`delete-confirm-${index}`}>Confirmation</Label>
                                    <Input
                                        id={`delete-confirm-${index}`}
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder='Type "DELETE" to confirm'
                                    />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => {
                                        handleDeletePermanent(index);
                                        setDeleteConfirmation('');
                                    }}
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
