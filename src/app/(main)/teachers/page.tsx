
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown } from "lucide-react";
import { BILLS_STORAGE_KEY } from "@/lib/constants";
import type { BillFormValues } from "../bill-form/page";
import * as XLSX from "xlsx";

type TeacherData = Omit<BillFormValues, 'id' | 'signature'>;

export default function TeachersDataPage() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);

  useEffect(() => {
    const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
    if (storedBills) {
      const allBills: BillFormValues[] = JSON.parse(storedBills);
      
      const uniqueTeachers = new Map<string, TeacherData>();
      
      allBills.forEach(bill => {
        // Use evaluatorId as the unique key for each teacher
        if (!uniqueTeachers.has(bill.evaluatorId)) {
          const { id, signature, ...teacherData } = bill;
          uniqueTeachers.set(bill.evaluatorId, teacherData);
        }
      });
      
      setTeachers(Array.from(uniqueTeachers.values()));
    }
  }, []);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(teachers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    XLSX.writeFile(workbook, "TeachersData.xlsx");
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-headline">Teachers Data</h1>
          <p className="text-lg text-muted-foreground mt-2">A centralized list of all teachers from bill submissions.</p>
        </div>
        <Button onClick={handleExport} disabled={teachers.length === 0}>
            <FileDown className="mr-2 h-4 w-4" /> Export to Excel
        </Button>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>All Teachers ({teachers.length})</CardTitle>
          <CardDescription>This list is compiled from all submitted bills.</CardDescription>
        </CardHeader>
        <CardContent>
          {teachers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary/90">
                    <TableHead className="text-primary-foreground">S. No.</TableHead>
                    <TableHead className="text-primary-foreground">Evaluator ID</TableHead>
                    <TableHead className="text-primary-foreground">Evaluator Name</TableHead>
                    <TableHead className="text-primary-foreground">College</TableHead>
                    <TableHead className="text-primary-foreground">Course</TableHead>
                    <TableHead className="text-primary-foreground">Mobile No.</TableHead>
                    <TableHead className="text-primary-foreground">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher, index) => (
                    <TableRow key={teacher.evaluatorId}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{teacher.evaluatorId}</TableCell>
                      <TableCell>{teacher.evaluatorName}</TableCell>
                      <TableCell>{teacher.collegeName}</TableCell>
                      <TableCell>{teacher.course}</TableCell>
                      <TableCell>{teacher.mobileNo}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="mt-4 text-lg font-medium">No Teacher Data Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Submit a bill to see teacher data here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
