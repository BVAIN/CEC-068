
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, Trash2, Search, Filter, Edit } from "lucide-react";
import { getBillsStorageKey, getTeacherTrashStorageKey } from "@/lib/constants";
import type { BillFormValues } from "../bill-form/page";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type TeacherData = Omit<BillFormValues, 'id' | 'signature'>;

type FilterValues = {
    [key in keyof TeacherData]?: string[];
};

export default function TeachersDataPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterValues>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedBills = localStorage.getItem(getBillsStorageKey());
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

        const filterMatch = Object.entries(filters).every(([key, value]) => {
            if (!value || value.length === 0) return true;
            const teacherValue = teacher[key as keyof TeacherData];
            return value.includes(String(teacherValue));
        });

        return searchMatch && filterMatch;
    });
  }, [teachers, searchTerm, filters]);
  
  const updateTeachersStateAndStorage = (updatedTeachers: TeacherData[]) => {
      setTeachers(updatedTeachers);
      
      // We need to update the original bills storage to reflect the deletion
      const storedBills = localStorage.getItem(getBillsStorageKey());
      if (storedBills) {
          let allBills: BillFormValues[] = JSON.parse(storedBills);
          const remainingTeacherIds = new Set(updatedTeachers.map(t => t.evaluatorId));
          const updatedBills = allBills.filter(bill => remainingTeacherIds.has(bill.evaluatorId));
          localStorage.setItem(getBillsStorageKey(), JSON.stringify(updatedBills));
      }
  };

  const handleDelete = (ids: string[]) => {
    const teachersToDelete = teachers.filter(t => ids.includes(t.evaluatorId));
    const remainingTeachers = teachers.filter(t => !ids.includes(t.evaluatorId));
    
    const storedTrash = localStorage.getItem(getTeacherTrashStorageKey());
    const trash = storedTrash ? JSON.parse(storedTrash) : [];
    localStorage.setItem(getTeacherTrashStorageKey(), JSON.stringify([...trash, ...teachersToDelete]));
    
    updateTeachersStateAndStorage(remainingTeachers);
    
    toast({ title: "Teachers Moved to Trash", description: `${ids.length} teacher(s) moved to trash.` });
    setSelectedTeachers([]);
  };

  const handleExport = () => {
    const dataToExport = filteredTeachers.map(teacher => {
        return {
            "Evaluator ID": teacher.evaluatorId,
            "Evaluator Name": teacher.evaluatorName,
            "College Name": teacher.collegeName,
            "Course": teacher.course,
            "Email": teacher.email,
            "PAN No.": teacher.panNo,
            "Address": teacher.address,
            "Distance": teacher.distance,
            "Mobile No.": teacher.mobileNo,
            "Bank Name": teacher.bankName,
            "Branch": teacher.branch,
            "Bank Account No.": teacher.bankAccountNo,
            "IFSC Code": teacher.ifscCode,
        };
    });
    
    if (dataToExport.length === 0) {
        toast({ variant: 'destructive', title: 'No data to export' });
        return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet([]);
    const headers = Object.keys(dataToExport[0]).map(header => {
        const capitalizedHeader = header.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return {
            v: capitalizedHeader,
            t: 's',
            s: { font: { bold: true } }
        };
    });
    
    XLSX.utils.sheet_add_aoa(worksheet, [headers.map(h => h.v)], { origin: 'A1' });
    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A2', skipHeader: true });

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
    setFilters(prev => {
        const currentValues = prev[field] || [];
        if (currentValues.includes(value)) {
            return { ...prev, [field]: currentValues.filter(v => v !== value) };
        } else {
            return { ...prev, [field]: [...currentValues, value] };
        }
    });
  };

  const handleEdit = (teacher: TeacherData) => {
      // Redirect to the bill form page and pre-fill the search with the teacher's ID
      // to show all bills for that teacher, allowing the user to edit them.
      router.push(`/bill-form?search=${encodeURIComponent(teacher.evaluatorId)}`);
  };

  const filterFields: { name: keyof FilterValues, label: string }[] = [
    { name: 'evaluatorName', label: 'Evaluator Name' },
    { name: 'evaluatorId', label: 'Evaluator ID' },
    { name: 'course', label: 'Course' },
    { name: 'collegeName', label: 'College Name' },
  ];

  const getUniqueValuesForFilter = (field: keyof FilterValues) => {
      const values = teachers.map(teacher => String(teacher[field]));
      return [...new Set(values)];
  }

  const MultiSelectFilter = ({ field, label }: { field: keyof FilterValues, label: string }) => {
      const [searchTerm, setSearchTerm] = useState("");
      const options = useMemo(() => getUniqueValuesForFilter(field), [field]);
      const filteredOptions = options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));
      const selectedValues = filters[field] || [];

      return (
          <Accordion type="single" collapsible>
              <AccordionItem value={field}>
                  <AccordionTrigger>{label} ({selectedValues.length})</AccordionTrigger>
                  <AccordionContent>
                      <div className="p-2 space-y-2">
                          <Input
                              placeholder="Search..."
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                          />
                          <ScrollArea className="h-48">
                              <div className="space-y-1">
                                  {filteredOptions.map(option => (
                                      <div key={option} className="flex items-center space-x-2">
                                          <Checkbox
                                              id={`filter-${field}-${option}`}
                                              checked={selectedValues.includes(option)}
                                              onCheckedChange={() => handleFilterChange(field, option)}
                                          />
                                          <Label htmlFor={`filter-${field}-${option}`} className="font-normal">{option}</Label>
                                      </div>
                                  ))}
                              </div>
                          </ScrollArea>
                      </div>
                  </AccordionContent>
              </AccordionItem>
          </Accordion>
      );
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
                                <div className="grid gap-1">
                                    {filterFields.map(field => (
                                       <MultiSelectFilter key={field.name} field={field.name} label={field.label} />
                                    ))}
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
                    <Button onClick={handleExport} disabled={filteredTeachers.length === 0} className="bg-green-500 hover:bg-green-600 text-white">
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
                          <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="icon" onClick={() => handleEdit(teacher)} style={{backgroundColor: 'green', color: 'white'}}>
                                  <Edit className="h-4 w-4" />
                              </Button>
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
                          </div>
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
