
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Trash2, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BillFormValues } from "../../bill-form/page";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BILLS_STORAGE_KEY, BILL_TRASH_STORAGE_KEY, BILLS_FILE_NAME } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { cn } from "@/lib/utils";


export default function BillTrashPage() {
  const [trashedBills, setTrashedBills] = useState<BillFormValues[]>([]);
  const [selectedTrash, setSelectedTrash] = useState<string[]>([]);
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const { isConnected, writeFile } = useGoogleDrive();

  useEffect(() => {
    const storedTrash = localStorage.getItem(BILL_TRASH_STORAGE_KEY);
    if (storedTrash) {
      setTrashedBills(JSON.parse(storedTrash));
    }
  }, []);
  
  const updateAndSaveTrash = (newTrash: BillFormValues[]) => {
    setTrashedBills(newTrash);
    localStorage.setItem(BILL_TRASH_STORAGE_KEY, JSON.stringify(newTrash));
  };

  const handleRestore = async (ids: string[]) => {
    const billsToRestore = trashedBills.filter((bill) => ids.includes(bill.id!));
    const newTrash = trashedBills.filter((bill) => !ids.includes(bill.id!));
    
    const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
    const bills = storedBills ? JSON.parse(storedBills) : [];
    const updatedBills = [...bills, ...billsToRestore];
    
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(updatedBills));
    if (isConnected) {
        try {
            await writeFile(BILLS_FILE_NAME, JSON.stringify(updatedBills, null, 2));
        } catch (e) {
            console.error("Failed to save restored bills to drive", e);
            toast({ variant: "destructive", title: "Sync Error", description: "Could not save restored bill(s) to Google Drive."});
        }
    }
    
    updateAndSaveTrash(newTrash);
    toast({ title: "Bills Restored", description: `${ids.length} bill(s) have been restored.`});
    setSelectedTrash([]);
  };
  
  const handleDeletePermanent = (ids: string[]) => {
    const newTrash = trashedBills.filter((bill) => !ids.includes(bill.id!));
    updateAndSaveTrash(newTrash);
    toast({ variant: "destructive", title: "Bills Deleted", description: `${ids.length} bill(s) have been permanently deleted.`});
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
      setSelectedTrash(trashedBills.map((bill) => bill.id!));
    } else {
      setSelectedTrash([]);
    }
  };


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Bill Trash</h1>
        <p className="text-lg text-muted-foreground mt-2">View and manage deleted bills.</p>
      </header>
      
      {trashedBills.length > 0 && selectedTrash.length > 0 && (
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
                                  This action will permanently delete {selectedTrash.length} bill(s). This cannot be undone. To confirm, type "DELETE".
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

      {trashedBills.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Deleted Bills</CardTitle>
            <CardDescription>Here are the bills you have deleted. You can restore them or delete them permanently.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>
                        <Checkbox
                          onCheckedChange={handleSelectAll}
                          checked={selectedTrash.length === trashedBills.length && trashedBills.length > 0}
                          aria-label="Select all"
                        />
                      </TableHead>
                    <TableHead>Evaluator Name</TableHead>
                    <TableHead>Evaluator ID</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashedBills.map((bill, index) => {
                     const isSelected = selectedTrash.includes(bill.id!);
                    return (
                    <TableRow key={bill.id} data-state={isSelected ? "selected" : "unselected"} className={cn(index % 2 === 0 ? "bg-muted/50" : "bg-background")}>
                       <TableCell>
                          <Checkbox
                            onCheckedChange={(checked) => bill.id && handleSelectTrash(bill.id, !!checked)}
                            checked={isSelected}
                            aria-label={`Select bill for ${bill.evaluatorName}`}
                          />
                        </TableCell>
                      <TableCell>{bill.evaluatorName}</TableCell>
                      <TableCell>{bill.evaluatorId}</TableCell>
                      <TableCell>{bill.course}</TableCell>
                      <TableCell>{bill.collegeName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleRestore([bill.id!])} className="bg-green-500 hover:bg-green-600 text-white">
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
                                    This action will permanently delete this bill. This cannot be undone. To confirm, type "DELETE".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor={`delete-confirm-${bill.id}`}>Confirmation</Label>
                                    <Input
                                        id={`delete-confirm-${bill.id}`}
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder='Type "DELETE" to confirm'
                                    />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePermanent([bill.id!])}
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
          <p className="mt-1 text-sm text-muted-foreground">Deleted bills will appear here.</p>
        </div>
      )}
    </div>
  );
}

    