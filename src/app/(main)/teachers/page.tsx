
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, Trash2, Search, Filter } from "lucide-react";
import { BILLS_STORAGE_KEY, TEACHER_TRASH_STORAGE_KEY } from "@/lib/constants";
import type { BillFormValues } from "../bill-form/page";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

type TeacherData = Omit<BillFormValues, 'id' | 'signature'>;

type FilterValues = {
    evaluatorName: string;
    evaluatorId: string;
    course: string;
};

export default function TeachersDataPage() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterValues>({ evaluatorName: '', evaluatorId: '', course: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
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

  const filteredTeachers = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    return teachers.filter(teacher => {
        const searchMatch = !lowercasedTerm || (
            teacher.evaluatorName.toLowerCase().includes(lowercasedTerm) ||
            teacher.evaluatorId.toLowerCase().includes(lowercasedTerm) ||
            teacher.course.toLowerCase().includes(lowercasedTerm) ||
            teacher.mobileNo.toLowerCase().includes(lowercasedTerm)
        );

        const filterMatch = 
            (filters.evaluatorName ? teacher.evaluatorName.toLowerCase().includes(filters.evaluatorName.toLowerCase()) : true) &&
            (filters.evaluatorId ? teacher.evaluatorId.toLowerCase().includes(filters.evaluatorId.toLowerCase()) : true) &&
            (filters.course ? teacher.course.toLowerCase().includes(filters.course.toLowerCase()) : true);

        return searchMatch && filterMatch;
    });
  }, [teachers, searchTerm, filters]);
  
  const updateTeachersStateAndStorage = (updatedTeachers: TeacherData[]) => {
      setTeachers(updatedTeachers);
      
      // We need to update the original bills storage to reflect the deletion
      const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
      if (storedBills) {
          let allBills: BillFormValues[] = JSON.parse(storedBills);
          const remainingTeacherIds = new Set(updatedTeachers.map(t => t.evaluatorId));
          const updatedBills = allBills.filter(bill => remainingTeacherIds.has(bill.evaluatorId));
          localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(updatedBills));
      }
  };

  const handleDelete = (ids: string[]) => {
    const teachersToDelete = teachers.filter(t => ids.includes(t.evaluatorId));
    const remainingTeachers = teachers.filter(t => !ids.includes(t.evaluatorId));
    
    const storedTrash = localStorage.getItem(TEACHER_TRASH_STORAGE_KEY);
    const trash = storedTrash ? JSON.parse(storedTrash) : [];
    localStorage.setItem(TEACHER_TRASH_STORAGE_KEY, JSON.stringify([...trash, ...teachersToDelete]));
    
    updateTeachersStateAndStorage(remainingTeachers);
    
    toast({ title: "Teachers Moved to Trash", description: `${ids.length} teacher(s) moved to trash.` });
    setSelectedTeachers([]);
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTeachers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    XLSX.writeFile(workbook, "TeachersData.xlsx");
  };
  
  const handleSelectTeacher = (id: string, checked: boolean) => {
    setSelectedTeachers(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeachers(filteredTeachers.map(t => t.evaluatorId));
    } else {
      setSelectedTeachers([]);
    }
  };

  const handleFilterChange = (field: keyof FilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-headline">Teachers Data</h1>
        </div>
      </header>
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center gap-4 flex-wrap">
                <div>
                  <CardTitle>All Teachers ({filteredTeachers.length})</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search teachers..." 
                            className="pl-10 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className="bg-pink-500 hover:bg-pink-600 text-white"><Filter className="mr-2 h-4 w-4"/> Filter</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                             <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Filters</h4>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="filter-name">Name</Label>
                                        <Input
                                            id="filter-name"
                                            value={filters.evaluatorName}
                                            onChange={(e) => handleFilterChange('evaluatorName', e.target.value)}
                                            className="col-span-2 h-8"
                                        />
                                    </div>
                                     <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="filter-id">Teacher ID</Label>
                                        <Input
                                            id="filter-id"
                                            value={filters.evaluatorId}
                                            onChange={(e) => handleFilterChange('evaluatorId', e.target.value)}
                                            className="col-span-2 h-8"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="filter-course">Course</Label>
                                        <Input
                                            id="filter-course"
                                            value={filters.course}
                                            onChange={(e) => handleFilterChange('course', e.target.value)}
                                            className="col-span-2 h-8"
                                        />
                                    </div>
                                </div>
                             </div>
                        </PopoverContent>
                    </Popover>
                    {selectedTeachers.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedTeachers.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will move {selectedTeachers.length} teacher(s) to the trash.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(selectedTeachers)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button onClick={handleExport} disabled={filteredTeachers.length === 0}>
                        <FileDown className="mr-2 h-4 w-4" /> Export to Excel
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-nav-teachers hover:bg-nav-teachers/90">
                    <TableHead className="text-primary-foreground w-12">
                         <Checkbox
                            onCheckedChange={handleSelectAll}
                            checked={filteredTeachers.length > 0 && selectedTeachers.length === filteredTeachers.length}
                            aria-label="Select all"
                            className="border-primary-foreground text-primary-foreground"
                         />
                    </TableHead>
                    <TableHead className="text-primary-foreground">S. No.</TableHead>
                    <TableHead className="text-primary-foreground">Evaluator ID</TableHead>
                    <TableHead className="text-primary-foreground">Evaluator Name</TableHead>
                    <TableHead className="text-primary-foreground">College</TableHead>
                    <TableHead className="text-primary-foreground">Course</TableHead>
                    <TableHead className="text-primary-foreground">Mobile No.</TableHead>
                    <TableHead className="text-primary-foreground">Email</TableHead>
                    <TableHead className="text-right text-primary-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher, index) => (
                    <TableRow key={teacher.evaluatorId} className={cn(index % 2 === 0 ? "bg-muted/50" : "bg-background")}>
                      <TableCell>
                         <Checkbox
                            onCheckedChange={(checked) => handleSelectTeacher(teacher.evaluatorId, !!checked)}
                            checked={selectedTeachers.includes(teacher.evaluatorId)}
                            aria-label={`Select ${teacher.evaluatorName}`}
                         />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{teacher.evaluatorId}</TableCell>
                      <TableCell>{teacher.evaluatorName}</TableCell>
                      <TableCell>{teacher.collegeName}</TableCell>
                      <TableCell>{teacher.course}</TableCell>
                      <TableCell>{teacher.mobileNo}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell className="text-right">
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon">
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>This will move this teacher to the trash.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete([teacher.evaluatorId])}>Continue</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="mt-4 text-lg font-medium">No Teacher Data Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Submit a bill to see teacher data here, or adjust your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
