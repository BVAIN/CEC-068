
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPublicIssuesStorageKey, getAwardsDispatchStorageKey, getAwardsDispatchTrashStorageKey } from "@/lib/constants";
import type { PublicIssueFormValues } from "@/app/(public)/entry/page";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Save, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  awardsCount?: string;
  dispatchDate?: string;
  noOfPages?: string;
};

type DispatchState = {
  [key: string]: AwardDispatchData;
};

const formatDate = (dateString: string) => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};


export default function AwardsDispatchPage() {
  const [awardEntries, setAwardEntries] = useState<AwardEntry[]>([]);
  const [dispatchData, setDispatchData] = useState<DispatchState>({});
  const { toast } = useToast();
  const [hydrated, setHydrated] = useState(false);

  const { totalNorth, totalSouth, grandTotal, totalAwards, totalPages } = useMemo(() => {
    let totalNorth = 0;
    let totalSouth = 0;
    let grandTotal = 0;
    let totalAwards = 0;
    let totalPages = 0;

    awardEntries.forEach(entry => {
        totalNorth += entry.northChallan;
        totalSouth += entry.southChallan;
        grandTotal += entry.totalChallan;
        
        const key = `${entry.dateOfExam}-${entry.upc}-${entry.qpNo}`;
        const data = dispatchData[key];
        if (data) {
            totalAwards += parseInt(data.awardsCount || '0', 10) || 0;
            totalPages += parseInt(data.noOfPages || '0', 10) || 0;
        }
    });

    return { totalNorth, totalSouth, grandTotal, totalAwards, totalPages };
  }, [awardEntries, dispatchData]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
        const storedEntries = localStorage.getItem(getPublicIssuesStorageKey());
        if (storedEntries) {
            const issues: PublicIssueFormValues[] = JSON.parse(storedEntries);
            
            const grouped = issues.reduce((acc, issue) => {
                const key = `${issue.dateOfExam}-${issue.upc}-${issue.qpNo}`;
                if (!acc[key]) {
                    acc[key] = {
                        upc: issue.upc,
                        qpNo: issue.qpNo,
                        dateOfExam: issue.dateOfExam,
                        course: issue.course,
                        type: issue.type,
                        northChallan: 0,
                        southChallan: 0,
                    };
                }
                if (issue.campus === 'North') {
                    acc[key].northChallan += issue.asPerChallan || 0;
                }
                if (issue.campus === 'South') {
                    acc[key].southChallan += issue.asPerChallan || 0;
                }
                return acc;
            }, {} as { [key: string]: Omit<AwardEntry, 'totalChallan'> });

            const processedEntries = Object.values(grouped).map(entry => ({
                ...entry,
                totalChallan: entry.northChallan + entry.southChallan
            }));
            
            setAwardEntries(processedEntries);
        }

        const storedDispatchData = localStorage.getItem(getAwardsDispatchStorageKey());
        if (storedDispatchData) {
            setDispatchData(JSON.parse(storedDispatchData));
        }
    } catch (error) {
        console.error("Error processing data:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load awards dispatch data."
        });
    }
  }, [hydrated, toast]);

  const handleInputChange = (key: string, field: keyof AwardDispatchData, value: string) => {
      setDispatchData(prev => ({
          ...prev,
          [key]: {
              ...prev[key],
              [field]: value
          }
      }));
  };

  const handleSaveRow = (key: string) => {
    try {
        localStorage.setItem(getAwardsDispatchStorageKey(), JSON.stringify(dispatchData));
        toast({ title: "Entry Saved", description: `Changes for UPC ${key.split('-')[1]} have been saved.` });
    } catch (error) {
        console.error("Failed to save data for one entry:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save the entry." });
    }
  };
  
  const handleSaveAll = () => {
    try {
        localStorage.setItem(getAwardsDispatchStorageKey(), JSON.stringify(dispatchData));
        toast({ title: "Data Saved", description: "All dispatch data has been saved successfully." });
    } catch (error) {
        console.error("Failed to save data:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save dispatch data." });
    }
  };

  const handleDeleteRow = (entryToDelete: AwardEntry) => {
    const keyToDelete = `${entryToDelete.dateOfExam}-${entryToDelete.upc}-${entryToDelete.qpNo}`;
    
    // Move to trash
    const storedTrash = localStorage.getItem(getAwardsDispatchTrashStorageKey());
    const trash = storedTrash ? JSON.parse(storedTrash) : [];
    const trashedItem = {
        entry: entryToDelete,
        dispatchData: dispatchData[keyToDelete] || {}
    };
    localStorage.setItem(getAwardsDispatchTrashStorageKey(), JSON.stringify([...trash, trashedItem]));

    // Remove from current state
    const newAwardEntries = awardEntries.filter(entry => 
        `${entry.dateOfExam}-${entry.upc}-${entry.qpNo}` !== keyToDelete
    );
    const newDispatchData = { ...dispatchData };
    delete newDispatchData[keyToDelete];
    
    setAwardEntries(newAwardEntries);
    setDispatchData(newDispatchData);
    
    // This is tricky because award entries are generated from public issues.
    // We cannot easily remove them from local storage without affecting other parts.
    // So for now, we just update the state. Re-visiting the page will bring it back.
    // A better approach would be to have a "deleted" flag.
    
    toast({ title: "Entry Moved to Trash", description: `Entry for UPC ${entryToDelete.upc} moved to trash.`});
  };

  const handleExport = () => {
    const dataToExport = awardEntries.map(entry => {
        const key = `${entry.dateOfExam}-${entry.upc}-${entry.qpNo}`;
        const extraData = dispatchData[key] || {};
        return {
            "Date of Exam": formatDate(entry.dateOfExam),
            "UPC": entry.upc,
            "QP No.": entry.qpNo,
            "Course": entry.course,
            "Type": entry.type,
            "North": entry.northChallan,
            "South": entry.southChallan,
            "Total": entry.totalChallan,
            "No. of Awards": extraData.awardsCount || '',
            "No. of Pages": extraData.noOfPages || '',
            "Date of Dispatch": extraData.dispatchDate || '',
        };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AwardsDispatch");
    XLSX.writeFile(workbook, "AwardsDispatchData.xlsx");
  };

  if (!hydrated) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline lg:text-5xl">Awards Dispatch Data</h1>
      </header>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Dispatch Entries</CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleSaveAll} className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Save className="mr-2 h-4 w-4"/> Save All Changes
                </Button>
                <Button onClick={handleExport} className="bg-green-500 hover:bg-green-600 text-white">
                    <FileDown className="mr-2 h-4 w-4"/> Export to Excel
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-nav-awards hover:bg-nav-awards/90">
                  <TableHead className="text-primary-foreground">Date of Exam</TableHead>
                  <TableHead className="text-primary-foreground">UPC</TableHead>
                  <TableHead className="text-primary-foreground">QP No.</TableHead>
                  <TableHead className="text-primary-foreground">Course</TableHead>
                  <TableHead className="text-primary-foreground">Type</TableHead>
                  <TableHead className="text-primary-foreground">North</TableHead>
                  <TableHead className="text-primary-foreground">South</TableHead>
                  <TableHead className="text-primary-foreground">Total</TableHead>
                  <TableHead className="text-primary-foreground">No. of Awards</TableHead>
                  <TableHead className="text-primary-foreground">No. of Pages</TableHead>
                  <TableHead className="text-primary-foreground">Date of Dispatch</TableHead>
                  <TableHead className="text-primary-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awardEntries.length > 0 ? awardEntries.map((entry, index) => {
                  const key = `${entry.dateOfExam}-${entry.upc}-${entry.qpNo}`;
                  const currentData = dispatchData[key] || {};
                  return (
                    <TableRow key={key} className={cn(index % 2 === 0 ? "bg-muted/50" : "bg-background")}>
                      <TableCell>{formatDate(entry.dateOfExam)}</TableCell>
                      <TableCell>{entry.upc}</TableCell>
                      <TableCell>{entry.qpNo}</TableCell>
                      <TableCell>{entry.course}</TableCell>
                      <TableCell>{entry.type}</TableCell>
                      <TableCell className="text-blue-600 font-medium">{entry.northChallan}</TableCell>
                      <TableCell className="text-red-600 font-medium">{entry.southChallan}</TableCell>
                      <TableCell className="font-bold">{entry.totalChallan}</TableCell>
                       <TableCell>
                        <Input
                          type="text"
                          className="w-24"
                          value={currentData.awardsCount || ''}
                          onChange={(e) => handleInputChange(key, 'awardsCount', e.target.value)}
                        />
                      </TableCell>
                       <TableCell>
                        <Input
                          type="text"
                          className="w-24"
                          value={currentData.noOfPages || ''}
                          onChange={(e) => handleInputChange(key, 'noOfPages', e.target.value)}
                        />
                      </TableCell>
                       <TableCell>
                        <Input
                          type="text"
                          className="w-48"
                          value={currentData.dispatchDate || ''}
                          onChange={(e) => handleInputChange(key, 'dispatchDate', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleSaveRow(key)}>
                                <Save className="h-4 w-4 text-blue-500" />
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will move this entry to the trash.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteRow(entry)}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                    <TableRow>
                        <TableCell colSpan={12} className="text-center h-24 text-muted-foreground">
                            No index entries found. Please add entries in the Index page.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
              {awardEntries.length > 0 && (
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={5} className="text-right font-bold">Grand Totals</TableCell>
                        <TableCell className="font-bold text-blue-600">{totalNorth}</TableCell>
                        <TableCell className="font-bold text-red-600">{totalSouth}</TableCell>
                        <TableCell className="font-bold">{grandTotal}</TableCell>
                        <TableCell className="font-bold">{totalAwards}</TableCell>
                        <TableCell className="font-bold">{totalPages}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                    </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
