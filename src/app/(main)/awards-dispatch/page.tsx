
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPublicIssuesStorageKey } from "@/lib/constants";
import type { PublicIssueFormValues } from "@/app/(public)/entry/page";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Save } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

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
  awardListCount?: number;
  awardsCount?: number;
  dispatchDate?: string;
};

type DispatchState = {
  [key: string]: AwardDispatchData;
};

const getAwardsDispatchStorageKey = () => {
    if (typeof window !== 'undefined') {
        const sessionId = localStorage.getItem('cec068_current_session');
        return sessionId ? `${sessionId}_awards_dispatch_data` : 'awards_dispatch_data';
    }
    return 'awards_dispatch_data';
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

  const { totalNorth, totalSouth, grandTotal, totalAwardLists, totalAwards } = useMemo(() => {
    let totalNorth = 0;
    let totalSouth = 0;
    let grandTotal = 0;
    let totalAwardLists = 0;
    let totalAwards = 0;

    awardEntries.forEach(entry => {
        totalNorth += entry.northChallan;
        totalSouth += entry.southChallan;
        grandTotal += entry.totalChallan;
        
        const key = `${entry.dateOfExam}-${entry.upc}-${entry.qpNo}`;
        const data = dispatchData[key];
        if (data) {
            totalAwardLists += Number(data.awardListCount || 0);
            totalAwards += Number(data.awardsCount || 0);
        }
    });

    return { totalNorth, totalSouth, grandTotal, totalAwardLists, totalAwards };
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

  const handleInputChange = (key: string, field: keyof AwardDispatchData, value: string | number) => {
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
            "No. of Award List": extraData.awardListCount || '',
            "No. of Awards": extraData.awardsCount || '',
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
                  <TableHead className="text-primary-foreground">No. of Award list</TableHead>
                  <TableHead className="text-primary-foreground">No. of Awards</TableHead>
                  <TableHead className="text-primary-foreground">Date of dispatch</TableHead>
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
                      <TableCell>{entry.northChallan}</TableCell>
                      <TableCell>{entry.southChallan}</TableCell>
                      <TableCell className="font-bold">{entry.totalChallan}</TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          className="w-24"
                          value={currentData.awardListCount || ''}
                          onChange={(e) => handleInputChange(key, 'awardListCount', e.target.value)}
                        />
                      </TableCell>
                       <TableCell>
                        <Input
                          type="number"
                          className="w-24"
                          value={currentData.awardsCount || ''}
                          onChange={(e) => handleInputChange(key, 'awardsCount', e.target.value)}
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
                        <Button size="icon" variant="ghost" onClick={() => handleSaveRow(key)}>
                            <Save className="h-4 w-4 text-blue-500" />
                        </Button>
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
                        <TableCell className="font-bold">{totalNorth}</TableCell>
                        <TableCell className="font-bold">{totalSouth}</TableCell>
                        <TableCell className="font-bold">{grandTotal}</TableCell>
                        <TableCell className="font-bold">{totalAwardLists}</TableCell>
                        <TableCell className="font-bold">{totalAwards}</TableCell>
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
