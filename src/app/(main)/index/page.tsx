
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { PUBLIC_ISSUES_STORAGE_KEY } from "@/lib/constants";
import type { PublicIssueFormValues } from "@/app/(public)/entry/page";

export default function IndexPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<PublicIssueFormValues[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const storedEntries = localStorage.getItem(PUBLIC_ISSUES_STORAGE_KEY);
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry =>
      entry.upc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.qpNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.dateOfExam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.course.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entries, searchTerm]);
  
  const northEntries = filteredEntries.filter(entry => entry.campus === 'North');
  const southEntries = filteredEntries.filter(entry => entry.campus === 'South');

  const calculateTotals = (campusEntries: PublicIssueFormValues[]) => {
    const totalChallan = campusEntries.reduce((acc, entry) => acc + (entry.asPerChallan || 0), 0);
    const totalNetScripts = campusEntries.reduce((acc, entry) => acc + (entry.netScripts || 0), 0);
    const totalDifference = totalChallan - totalNetScripts;
    return { totalChallan, totalNetScripts, totalDifference };
  }

  const northTotals = calculateTotals(northEntries);
  const southTotals = calculateTotals(southEntries);

  const renderTable = (title: string, data: PublicIssueFormValues[], totals: {totalChallan: number, totalNetScripts: number, totalDifference: number}) => (
     <Card className="mt-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date of Exam</TableHead>
              <TableHead>UPC</TableHead>
              <TableHead>QP No.</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>As Per Challan</TableHead>
              <TableHead>Net Scripts</TableHead>
              <TableHead>Difference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>{entry.dateOfExam}</TableCell>
                <TableCell>{entry.upc}</TableCell>
                <TableCell>{entry.qpNo}</TableCell>
                <TableCell>{entry.course}</TableCell>
                <TableCell>{entry.asPerChallan}</TableCell>
                <TableCell>{entry.netScripts}</TableCell>
                <TableCell>{(entry.asPerChallan || 0) - (entry.netScripts || 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="text-right font-bold">Total</TableCell>
              <TableCell className="font-bold">{totals.totalChallan}</TableCell>
              <TableCell className="font-bold">{totals.totalNetScripts}</TableCell>
              <TableCell className="font-bold">{totals.totalDifference}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-headline">Index</h1>
          <p className="text-lg text-muted-foreground mt-2">Select a campus to view its forms.</p>
        </div>
        <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search by UPC, QP No., Date, Course..." 
                  className="pl-10 w-72"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => handleNavigation('/entry')}
            >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Entry
            </Button>
        </div>
      </header>
      
        {renderTable("North Campus", northEntries, northTotals)}
        {renderTable("South Campus", southEntries, southTotals)}
    </div>
  );
}
