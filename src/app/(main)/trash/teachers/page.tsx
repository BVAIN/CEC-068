
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
import { TEACHER_TRASH_STORAGE_KEY } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TeacherData = Omit<BillFormValues, 'id' | 'signature'>;

export default function TeacherTrashPage() {
  const [trashedTeachers, setTrashedTeachers] = useState<TeacherData[]>([]);
  const [selectedTrash, setSelectedTrash] = useState<string[]>([]);
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const storedTrash = localStorage.getItem(TEACHER_TRASH_STORAGE_KEY);
    if (storedTrash) {
      setTrashedTeachers(JSON.parse(storedTrash));
    }
  }, [hydrated]);
  
  const updateAndSaveTrash = (newTrash: TeacherData[]) => {
    setTrashedTeachers(newTrash);
    localStorage.setItem(TEACHER_TRASH_STORAGE_KEY, JSON.stringify(newTrash));
  };

  const handleRestore = (ids: string[]) => {
    const newTrash = trashedTeachers.filter((teacher) => !ids.includes(teacher.evaluatorId));
    
    // Since teacher data is derived from bills, we just remove them from trash.
    // They will reappear in the main list if their source bills exist and are not in trash.
    
    updateAndSaveTrash(newTrash);
    toast({ title: "Teachers Restored", description: `${ids.length} teacher(s) have been restored. They will reappear in the main list if their source bills exist.`});
    setSelectedTrash([]);
  };
  
  const handleDeletePermanent = (ids: string[]) => {
    const newTrash = trashedTeachers.filter((teacher) => !ids.includes(teacher.evaluatorId));
    updateAndSaveTrash(newTrash);
    toast({ variant: "destructive", title: "Teachers Deleted", description: `${ids.length} teacher(s) have been permanently deleted.`});
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
      setSelectedTrash(trashedTeachers.map((teacher) => teacher.evaluatorId));
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
        <h1 className="text-4xl font-bold tracking-tight font-headline">Teacher Trash</h1>
      </header>
      
      {trashedTeachers.length > 0 && selectedTrash.length > 0 && (
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
                                  This action will permanently delete {selectedTrash.length} teacher(s). This cannot be undone. To confirm, type "DELETE".
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

      {trashedTeachers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Deleted Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-nav-teachers hover:bg-nav-teachers/90">
                     <TableHead className="text-primary-foreground">
                        <Checkbox
                          onCheckedChange={handleSelectAll}
                          checked={selectedTrash.length === trashedTeachers.length && trashedTeachers.length > 0}
                          aria-label="Select all"
                           className="border-primary-foreground text-primary-foreground"
                        />
                      </TableHead>
                    <TableHead className="text-primary-foreground">Evaluator Name</TableHead>
                    <TableHead className="text-primary-foreground">Evaluator ID</TableHead>
                    <TableHead className="text-primary-foreground">Course</TableHead>
                    <TableHead className="text-primary-foreground">College</TableHead>
                    <TableHead className="text-right text-primary-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashedTeachers.map((teacher, index) => {
                     const isSelected = selectedTrash.includes(teacher.evaluatorId);
                    return (
                    <TableRow key={teacher.evaluatorId} data-state={isSelected ? "selected" : "unselected"} className={cn(index % 2 === 0 ? "bg-muted/50" : "bg-background")}>
                       <TableCell>
                          <Checkbox
                            onCheckedChange={(checked) => handleSelectTrash(teacher.evaluatorId, !!checked)}
                            checked={isSelected}
                            aria-label={`Select teacher ${teacher.evaluatorName}`}
                          />
                        </TableCell>
                      <TableCell>{teacher.evaluatorName}</TableCell>
                      <TableCell>{teacher.evaluatorId}</TableCell>
                      <TableCell>{teacher.course}</TableCell>
                      <TableCell>{teacher.collegeName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleRestore([teacher.evaluatorId])} className="bg-green-500 hover:bg-green-600 text-white">
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
                                    This action will permanently delete this teacher record. This cannot be undone. To confirm, type "DELETE".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor={`delete-confirm-${teacher.evaluatorId}`}>Confirmation</Label>
                                    <Input
                                        id={`delete-confirm-${teacher.evaluatorId}`}
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder='Type "DELETE" to confirm'
                                    />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePermanent([teacher.evaluatorId])}
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
          <p className="mt-1 text-sm text-muted-foreground">Deleted teachers will appear here.</p>
        </div>
      )}
    </div>
  );
}
