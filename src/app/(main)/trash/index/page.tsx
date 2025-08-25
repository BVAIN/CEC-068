
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Trash2, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PUBLIC_ISSUES_STORAGE_KEY, INDEX_TRASH_STORAGE_KEY } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicIssueFormValues } from "@/app/(public)/entry/page";
import { cn } from "@/lib/utils";


export default function IndexTrashPage() {
  const [trashedEntries, setTrashedEntries] = useState<PublicIssueFormValues[]>([]);
  const [selectedTrash, setSelectedTrash] = useState<string[]>([]);
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [secondDeleteConfirmation, setSecondDeleteConfirmation] = useState(false);


  useEffect(() => {
    const storedTrash = localStorage.getItem(INDEX_TRASH_STORAGE_KEY);
    if (storedTrash) {
      setTrashedEntries(JSON.parse(storedTrash));
    }
  }, []);
  
  const updateAndSaveTrash = (newTrash: PublicIssueFormValues[]) => {
    setTrashedEntries(newTrash);
    localStorage.setItem(INDEX_TRASH_STORAGE_KEY, JSON.stringify(newTrash));
  };

  const handleRestore = (ids: string[]) => {
    const entriesToRestore = trashedEntries.filter((entry) => ids.includes(entry.id!));
    const newTrash = trashedEntries.filter((entry) => !ids.includes(entry.id!));
    
    const storedEntries = localStorage.getItem(PUBLIC_ISSUES_STORAGE_KEY);
    const entries = storedEntries ? JSON.parse(storedEntries) : [];
    localStorage.setItem(PUBLIC_ISSUES_STORAGE_KEY, JSON.stringify([...entries, ...entriesToRestore]));
    
    updateAndSaveTrash(newTrash);
    toast({ title: "Entries Restored", description: `${ids.length} entries have been restored.`});
    setSelectedTrash([]);
  };
  
  const handleDeletePermanent = (ids: string[]) => {
    const newTrash = trashedEntries.filter((entry) => !ids.includes(entry.id!));
    updateAndSaveTrash(newTrash);
    toast({ variant: "destructive", title: "Entries Deleted", description: `${ids.length} entries have been permanently deleted.`});
    setSelectedTrash([]);
    setDeleteConfirmation('');
    setSecondDeleteConfirmation(false);
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
      setSelectedTrash(trashedEntries.map((entry) => entry.id!));
    } else {
      setSelectedTrash([]);
    }
  };

  const FirstDeleteDialog = ({ onContinue }: { onContinue: () => void }) => (
     <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected entries.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onContinue}>Continue</AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
  );

  const SecondDeleteDialog = ({ ids, onCancel }: { ids: string[], onCancel: () => void}) => (
      <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Final Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
            This is your final warning. To permanently delete these entries, type "DELETE".
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
            <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
            onClick={() => handleDeletePermanent(ids)}
            disabled={deleteConfirmation !== 'DELETE'}
            >
            Delete Permanently
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Index Trash</h1>
      </header>
      
      <AlertDialog onOpenChange={(open) => !open && (setDeleteConfirmation(''), setSecondDeleteConfirmation(false))}>
        {trashedEntries.length > 0 && selectedTrash.length > 0 && (
            <Card>
                <CardContent className="pt-6 flex gap-4">
                    <Button onClick={() => handleRestore(selectedTrash)} className="bg-green-500 hover:bg-green-600 text-white"><History className="mr-2 h-4 w-4" /> Restore Selected ({selectedTrash.length})</Button>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive"><ShieldX className="mr-2 h-4 w-4" /> Delete Selected ({selectedTrash.length})</Button>
                    </AlertDialogTrigger>
                </CardContent>
            </Card>
        )}

        {!secondDeleteConfirmation ? 
            <FirstDeleteDialog onContinue={() => setSecondDeleteConfirmation(true)} /> :
            <SecondDeleteDialog ids={selectedTrash} onCancel={() => setSecondDeleteConfirmation(false)} />
        }
      </AlertDialog>


      {trashedEntries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Deleted Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary/90">
                     <TableHead className="text-primary-foreground">
                        <Checkbox
                          onCheckedChange={handleSelectAll}
                          checked={selectedTrash.length === trashedEntries.length && trashedEntries.length > 0}
                          aria-label="Select all"
                          className="border-primary-foreground text-primary-foreground"
                        />
                      </TableHead>
                    <TableHead className="text-primary-foreground">Date of Exam</TableHead>
                    <TableHead className="text-primary-foreground">Course</TableHead>
                    <TableHead className="text-primary-foreground">Campus</TableHead>
                    <TableHead className="text-primary-foreground">Type</TableHead>
                    <TableHead className="text-primary-foreground">UPC</TableHead>
                    <TableHead className="text-primary-foreground">QP No.</TableHead>
                    <TableHead className="text-primary-foreground">Page No.</TableHead>
                    <TableHead className="text-right text-primary-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashedEntries.map((entry, index) => {
                     const isSelected = selectedTrash.includes(entry.id!);
                    return (
                    <TableRow key={entry.id} data-state={isSelected ? "selected" : "unselected"} className={cn(index % 2 === 0 ? "bg-muted/50" : "bg-background")}>
                       <TableCell>
                          <Checkbox
                            onCheckedChange={(checked) => entry.id && handleSelectTrash(entry.id, !!checked)}
                            checked={isSelected}
                            aria-label={`Select entry from ${entry.dateOfExam}`}
                          />
                        </TableCell>
                      <TableCell>{entry.dateOfExam}</TableCell>
                      <TableCell>{entry.course}</TableCell>
                      <TableCell>{entry.campus}</TableCell>
                      <TableCell>{entry.type}</TableCell>
                      <TableCell>{entry.upc}</TableCell>
                      <TableCell>{entry.qpNo}</TableCell>
                      <TableCell>{entry.pageNo}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleRestore([entry.id!])} className="bg-green-500 hover:bg-green-600 text-white">
                              <History className="mr-2 h-4 w-4" /> Restore
                            </Button>
                             <AlertDialog onOpenChange={(open) => !open && (setDeleteConfirmation(''), setSecondDeleteConfirmation(false))}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                                </AlertDialogTrigger>
                                {!secondDeleteConfirmation ? 
                                    <FirstDeleteDialog onContinue={() => setSecondDeleteConfirmation(true)} /> :
                                    <SecondDeleteDialog ids={[entry.id!]} onCancel={() => setSecondDeleteConfirmation(false)} />
                                }
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
          <p className="mt-1 text-sm text-muted-foreground">Deleted entries will appear here.</p>
        </div>
      )}
    </div>
  );
}
