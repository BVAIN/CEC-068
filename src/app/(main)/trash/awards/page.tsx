
      "use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Trash2, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getAwardsDispatchStorageKey, getAwardsDispatchTrashStorageKey } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Types from the main page
type AwardEntry = {
  upc: string;
  qpNo: string;
  dateOfExam: string;
  course: string;
  type: "Regular" | "NCWEB" | "SOL";
  northChallan: number;
  southChallan: number;
  totalChallan: number;
};

type AwardDispatchData = {
  dispatchDate?: string;
  noOfPages?: string;
};

type TrashedItem = {
    entry: AwardEntry;
    dispatchData: AwardDispatchData;
};

const formatDate = (dateString: string) => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

export default function AwardsTrashPage() {
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([]);
  const [selectedTrash, setSelectedTrash] = useState<string[]>([]);
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const getItemKey = (entry: AwardEntry) => `${entry.dateOfExam}-${entry.upc}-${entry.qpNo}`;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const storedTrash = localStorage.getItem(getAwardsDispatchTrashStorageKey());
    if (storedTrash) {
      setTrashedItems(JSON.parse(storedTrash));
    }
  }, [hydrated]);
  
  const updateAndSaveTrash = (newTrash: TrashedItem[]) => {
    setTrashedItems(newTrash);
    localStorage.setItem(getAwardsDispatchTrashStorageKey(), JSON.stringify(newTrash));
  };

  const handleRestore = (ids: string[]) => {
    const itemsToRestore = trashedItems.filter((item) => ids.includes(getItemKey(item.entry)));
    const newTrash = trashedItems.filter((item) => !ids.includes(getItemKey(item.entry)));
    
    // NOTE: Restoring award dispatch data is complex because the source `awardEntries`
    // are generated dynamically from `public_issues`. A simple restore might not work
    // if the underlying public issue is gone. This implementation restores the `dispatchData` only.
    const storedDispatchData = localStorage.getItem(getAwardsDispatchStorageKey());
    const dispatchData = storedDispatchData ? JSON.parse(storedDispatchData) : {};

    itemsToRestore.forEach(item => {
        const key = getItemKey(item.entry);
        dispatchData[key] = item.dispatchData;
    });

    localStorage.setItem(getAwardsDispatchStorageKey(), JSON.stringify(dispatchData));
    
    updateAndSaveTrash(newTrash);
    toast({ title: "Entries Restored", description: `${ids.length} entries have been restored. They will reappear on the main page upon refresh if the source data exists.`});
    setSelectedTrash([]);
  };
  
  const handleDeletePermanent = (ids: string[]) => {
    const newTrash = trashedItems.filter((item) => !ids.includes(getItemKey(item.entry)));
    updateAndSaveTrash(newTrash);
    toast({ variant: "destructive", title: "Entries Deleted", description: `${ids.length} entries have been permanently deleted.`});
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
      setSelectedTrash(trashedItems.map((item) => getItemKey(item.entry)));
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
        <h1 className="text-4xl font-bold tracking-tight font-headline">Awards Dispatch Trash</h1>
      </header>
      
      {trashedItems.length > 0 && selectedTrash.length > 0 && (
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
                                  This action will permanently delete {selectedTrash.length} entries. This cannot be undone. To confirm, type "DELETE".
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

      {trashedItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Deleted Dispatch Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-nav-awards hover:bg-nav-awards/90">
                     <TableHead className="text-primary-foreground">
                        <Checkbox
                          onCheckedChange={handleSelectAll}
                          checked={selectedTrash.length === trashedItems.length && trashedItems.length > 0}
                          aria-label="Select all"
                           className="border-primary-foreground text-primary-foreground"
                        />
                      </TableHead>
                    <TableHead className="text-primary-foreground">Date of Exam</TableHead>
                    <TableHead className="text-primary-foreground">UPC</TableHead>
                    <TableHead className="text-primary-foreground">Course</TableHead>
                    <TableHead className="text-primary-foreground">Type</TableHead>
                    <TableHead className="text-right text-primary-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashedItems.map((item) => {
                     const key = getItemKey(item.entry);
                     const isSelected = selectedTrash.includes(key);
                    return (
                    <TableRow key={key} data-state={isSelected ? "selected" : "unselected"} className={cn(isSelected ? "bg-muted" : "")}>
                       <TableCell>
                          <Checkbox
                            onCheckedChange={(checked) => handleSelectTrash(key, !!checked)}
                            checked={isSelected}
                            aria-label={`Select entry for ${item.entry.upc}`}
                          />
                        </TableCell>
                      <TableCell>{formatDate(item.entry.dateOfExam)}</TableCell>
                      <TableCell>{item.entry.upc}</TableCell>
                      <TableCell>{item.entry.course}</TableCell>
                      <TableCell>{item.entry.type}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleRestore([key])} className="bg-green-500 hover:bg-green-600 text-white">
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
                                    This action will permanently delete this entry. This cannot be undone. To confirm, type "DELETE".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor={`delete-confirm-${key}`}>Confirmation</Label>
                                    <Input
                                        id={`delete-confirm-${key}`}
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder='Type "DELETE" to confirm'
                                    />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePermanent([key])}
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
          <p className="mt-1 text-sm text-muted-foreground">Deleted awards dispatch entries will appear here.</p>
        </div>
      )}
    </div>
  );
}

    