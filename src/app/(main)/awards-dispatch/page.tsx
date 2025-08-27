
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPublicIssuesStorageKey, getAwardsDispatchStorageKey, getAwardsDispatchTrashStorageKey } from "@/lib/constants";
import type { PublicIssueFormValues } from "@/app/(public)/entry/page";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Save, Trash2, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type AwardEntry = {
  upc: string;
  qpNo: string;
  dateOfExam: string;
  course: string;
  type: "Regular" | "NCWEB" | "SOL";
  pageNo: number;
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

type FilterValues = {
  dateOfExam: string;
  upc: string;
  qpNo: string;
  course: string;
  type: string;
  awardsCount: string;
  noOfPages: string;
  dispatchDate: string;
};

const formatDate = (dateString: string) => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};


export default function AwardsDispatchPage() {
  const [allAwardEntries, setAllAwardEntries] = useState<AwardEntry[]>([]);
  const [dispatchData, setDispatchData] = useState<DispatchState>({});
  const { toast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [filters, setFilters] = useState<Partial<FilterValues>>({});
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  
  const getEntryKey = (entry: AwardEntry) => `${entry.dateOfExam}-${entry.upc}-${entry.qpNo}`;

  useEffect(() => {
    setHydrated(true);
  }, []);
  
  const { filteredAwards, totalNorth, totalSouth, grandTotal } = useMemo(() => {
    const filtered = allAwardEntries.filter(entry => {
        const key = getEntryKey(entry);
        const currentDispatchData = dispatchData[key] || {};
        return Object.entries(filters).every(([filterKey, filterValue]) => {
            if (!filterValue) return true;
            if (filterKey in entry) {
                return String(entry[filterKey as keyof AwardEntry]).toLowerCase().includes(filterValue.toLowerCase());
            }
            if (filterKey in currentDispatchData) {
                return String(currentDispatchData[filterKey as keyof AwardDispatchData]).toLowerCase().includes(filterValue.toLowerCase());
            }
            return true;
        });
    });

    let totalNorth = 0;
    let totalSouth = 0;
    let grandTotal = 0;

    filtered.forEach(entry => {
        totalNorth += entry.northChallan;
        totalSouth += entry.southChallan;
        grandTotal += entry.totalChallan;
    });

    return { filteredAwards: filtered, totalNorth, totalSouth, grandTotal };
  }, [allAwardEntries, dispatchData, filters]);


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
                        pageNo: parseInt(issue.pageNo || '0', 10),
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
                // If an entry for a different campus already set a page number, use the smaller one
                const currentPageNo = parseInt(issue.pageNo || '0', 10);
                if (currentPageNo < acc[key].pageNo) {
                    acc[key].pageNo = currentPageNo;
                }
                return acc;
            }, {} as { [key: string]: Omit<AwardEntry, 'totalChallan'> });

            const processedEntries = Object.values(grouped).map(entry => ({
                ...entry,
                totalChallan: entry.northChallan + entry.southChallan
            })).sort((a, b) => a.pageNo - b.pageNo);
            
            setAllAwardEntries(processedEntries);
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

  const handleDelete = (keysToDelete: string[]) => {
    const storedTrash = localStorage.getItem(getAwardsDispatchTrashStorageKey());
    const trash = storedTrash ? JSON.parse(storedTrash) : [];

    const entriesToTrash = allAwardEntries.filter(entry => keysToDelete.includes(getEntryKey(entry)));
    const trashedItems = entriesToTrash.map(entry => ({
        entry,
        dispatchData: dispatchData[getEntryKey(entry)] || {}
    }));

    localStorage.setItem(getAwardsDispatchTrashStorageKey(), JSON.stringify([...trash, ...trashedItems]));

    const newAwardEntries = allAwardEntries.filter(entry => 
        !keysToDelete.includes(getEntryKey(entry))
    );
    const newDispatchData = { ...dispatchData };
    keysToDelete.forEach(key => delete newDispatchData[key]);
    
    setAllAwardEntries(newAwardEntries);
    setDispatchData(newDispatchData);
    setSelectedEntries([]);
    
    toast({ title: "Entries Moved to Trash", description: `${keysToDelete.length} entries moved to trash.`});
  };

  const handleExport = () => {
    const dataToExport = filteredAwards.map(entry => {
        const key = getEntryKey(entry);
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
            "No. of Pages": extraData.noOfPages || '',
            "Date of Dispatch": extraData.dispatchDate || '',
        };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AwardsDispatch");
    XLSX.writeFile(workbook, "AwardsDispatchData.xlsx");
  };

  const handleFilterChange = (field: keyof FilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSelectEntry = (key: string, checked: boolean) => {
      if (checked) {
          setSelectedEntries(prev => [...prev, key]);
      } else {
          setSelectedEntries(prev => prev.filter(k => k !== key));
      }
  };

  const handleSelectAll = (checked: boolean) => {
      if (checked) {
          setSelectedEntries(filteredAwards.map(getEntryKey));
      } else {
          setSelectedEntries([]);
      }
  };


  if (!hydrated) {
    return null; 
  }

  const filterFields: { name: keyof FilterValues, label: string }[] = [
      { name: 'dateOfExam', label: 'Date of Exam' },
      { name: 'upc', label: 'UPC' },
      { name: 'qpNo', label: 'QP No.' },
      { name: 'course', label: 'Course' },
      { name: 'type', label: 'Type' },
      { name: 'noOfPages', label: 'No. of Pages' },
      { name: 'dispatchDate', label: 'Date of Dispatch' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline lg:text-5xl">Awards Dispatch Data</h1>
      </header>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Dispatch Entries ({filteredAwards.length})</CardTitle>
            </div>
            <div className="flex items-center gap-2">
                {selectedEntries.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedEntries.length})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will move {selectedEntries.length} entries to the trash.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(selectedEntries)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button className="bg-pink-500 hover:bg-pink-600 text-white"><Filter className="mr-2 h-4 w-4"/> Filter</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto">
                        <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Filters</h4>
                        </div>
                        <div className="grid gap-2">
                            {filterFields.map(field => (
                                <div key={field.name} className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                                    <Input
                                        id={`filter-${field.name}`}
                                        value={filters[field.name as keyof typeof filters] || ''}
                                        onChange={(e) => handleFilterChange(field.name as keyof FilterValues, e.target.value)}
                                        className="col-span-2 h-8"
                                    />
                                </div>
                            ))}
                        </div>
                        </div>
                    </PopoverContent>
                </Popover>
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
                  <TableHead className="text-primary-foreground">
                    <Checkbox
                      onCheckedChange={handleSelectAll}
                      checked={filteredAwards.length > 0 && selectedEntries.length === filteredAwards.length}
                      aria-label="Select all"
                      className="border-primary-foreground text-primary-foreground"
                    />
                  </TableHead>
                  <TableHead className="text-primary-foreground">Date of Exam</TableHead>
                  <TableHead className="text-primary-foreground">UPC</TableHead>
                  <TableHead className="text-primary-foreground">QP No.</TableHead>
                  <TableHead className="text-primary-foreground">Course</TableHead>
                  <TableHead className="text-primary-foreground">Type</TableHead>
                  <TableHead className="text-primary-foreground">Page No.</TableHead>
                  <TableHead className="text-primary-foreground">North</TableHead>
                  <TableHead className="text-primary-foreground">South</TableHead>
                  <TableHead className="text-primary-foreground">Total</TableHead>
                  <TableHead className="text-primary-foreground">No. of Pages</TableHead>
                  <TableHead className="text-primary-foreground">Date of Dispatch</TableHead>
                  <TableHead className="text-primary-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAwards.length > 0 ? filteredAwards.map((entry, index) => {
                  const key = getEntryKey(entry);
                  const currentData = dispatchData[key] || {};
                  const isSelected = selectedEntries.includes(key);
                  return (
                    <TableRow key={key} className={cn(index % 2 === 0 ? "bg-muted/50" : "bg-background")} data-state={isSelected ? "selected" : ""}>
                      <TableCell>
                        <Checkbox
                            onCheckedChange={(checked) => handleSelectEntry(key, !!checked)}
                            checked={isSelected}
                            aria-label={`Select entry for UPC ${entry.upc}`}
                        />
                      </TableCell>
                      <TableCell>{formatDate(entry.dateOfExam)}</TableCell>
                      <TableCell>{entry.upc}</TableCell>
                      <TableCell>{entry.qpNo}</TableCell>
                      <TableCell>{entry.course}</TableCell>
                      <TableCell>{entry.type}</TableCell>
                      <TableCell>{entry.pageNo}</TableCell>
                      <TableCell className="text-blue-600 font-medium">{entry.northChallan}</TableCell>
                      <TableCell className="text-red-600 font-medium">{entry.southChallan}</TableCell>
                      <TableCell className="font-bold">{entry.totalChallan}</TableCell>
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
                                    <AlertDialogAction onClick={() => handleDelete([key])}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                    <TableRow>
                        <TableCell colSpan={13} className="text-center h-24 text-muted-foreground">
                            No index entries found. Please add entries in the Index page.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
              {filteredAwards.length > 0 && (
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={7} className="text-right font-bold">Grand Totals</TableCell>
                        <TableCell className="font-bold text-blue-600">{totalNorth}</TableCell>
                        <TableCell className="font-bold text-red-600">{totalSouth}</TableCell>
                        <TableCell className="font-bold">{grandTotal}</TableCell>
                        <TableCell colSpan={3}></TableCell>
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
