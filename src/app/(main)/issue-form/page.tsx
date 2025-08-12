
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Edit, Trash2, Printer, FileDown, Search, Save, Eye, Filter, ShieldX } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const issueFormSchema = z.object({
  tokenNo: z.number().optional(),
  dateOfIssue: z.string().min(1, "Date of Issue is required"),
  packetNo: z.string().min(1, "Packet No. is required"),
  packetFrom: z.string().min(1, "Packet No. (From) is required"),
  packetTo: z.string().optional(),
  noOfScripts: z.coerce.number().min(1, "Number of Scripts must be at least 1"),
  qpNo: z.string().optional(),
  upc: z.string().optional(),
  teacherName: z.string().min(1, "Teacher Name is required"),
  mobileNo: z.string().min(1, "Mobile No. is required"),
  email: z.string().email("Invalid email address"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  college: z.string().min(1, "College is required"),
  course: z.string().min(1, "Course is required"),
  campus: z.enum(["North", "South"]).optional(),
  schoolType: z.enum(["Regular", "NCWEB", "SOL"]).optional(),
  received: z.boolean().default(false),
  noOfAbsent: z.coerce.number().optional(),
  noOfMissing: z.coerce.number().optional(),
  extraSheets: z.coerce.number().optional(),
});

export type IssueFormValues = z.infer<typeof issueFormSchema>;

const ISSUES_STORAGE_KEY = 'cec068_issues';
const TRASH_STORAGE_KEY = 'cec068_trash';
const QP_UPC_MAP_KEY = 'cec068_qp_upc_map';
const TEACHER_COURSE_TOKEN_MAP_KEY = 'cec068_teacher_course_token_map';

// Populate with some initial data for demonstration
const seedQpUpcMap = () => {
    if (typeof window !== 'undefined' && !localStorage.getItem(QP_UPC_MAP_KEY)) {
        const initialMap = {
            'QP123': 'UPC_A',
            'QP456': 'UPC_B',
            'QP789': 'UPC_C',
        };
        localStorage.setItem(QP_UPC_MAP_KEY, JSON.stringify(initialMap));
    }
};

type FilterValues = {
  dateOfIssue: string;
  qpNo: string;
  upc: string;
  course: string;
  campus: ("North" | "South")[];
  type: ("Regular" | "NCWEB" | "SOL")[];
  teacherId: string;
  teacherName: string;
};


export default function ScriptsIssueFormPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<IssueFormValues[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<number[]>([]);
  const [qpUpcMap, setQpUpcMap] = useState<Record<string, string>>({});
  const [teacherCourseTokenMap, setTeacherCourseTokenMap] = useState<Record<string, Record<string, number>>>({});
  const [isAutofilled, setIsAutofilled] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    dateOfIssue: "",
    qpNo: "",
    upc: "",
    course: "",
    campus: [],
    type: [],
    teacherId: "",
    teacherName: ""
  });


  useEffect(() => {
    seedQpUpcMap();
    const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (storedIssues) {
      setIssues(JSON.parse(storedIssues).sort((a: IssueFormValues, b: IssueFormValues) => new Date(b.dateOfIssue).getTime() - new Date(a.dateOfIssue).getTime()));
    }
    const storedMap = localStorage.getItem(QP_UPC_MAP_KEY);
    if (storedMap) {
        setQpUpcMap(JSON.parse(storedMap));
    }
    const storedTokenMap = localStorage.getItem(TEACHER_COURSE_TOKEN_MAP_KEY);
    if(storedTokenMap) {
        setTeacherCourseTokenMap(JSON.parse(storedTokenMap));
    }
  }, []);

  const form = useForm<IssueFormValues>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: {
      dateOfIssue: "",
      packetNo: "",
      packetFrom: "",
      packetTo: "",
      noOfScripts: undefined,
      qpNo: "",
      upc: "",
      teacherName: "",
      mobileNo: "",
      email: "",
      teacherId: "",
      college: "",
      course: "",
      campus: undefined,
      schoolType: undefined,
      received: false,
      noOfAbsent: 0,
      tokenNo: undefined,
      noOfMissing: 0,
      extraSheets: 0,
    },
  });

  const { watch, setValue, getValues } = form;
  const watchedTeacherId = watch('teacherId');
  const watchedQpNo = watch('qpNo');
  const watchedTeacherName = watch('teacherName');
  const watchedCourse = watch('course');
  const watchedCollege = watch('college');
  const watchedMobileNo = watch('mobileNo');
  const watchedEmail = watch('email');

  useEffect(() => {
    if (watchedTeacherId && editingIndex === null) {
      const existingTeacherIssue = issues.find(issue => issue.teacherId === watchedTeacherId);
      if (existingTeacherIssue) {
        setValue('teacherName', existingTeacherIssue.teacherName);
        setValue('mobileNo', existingTeacherIssue.mobileNo);
        setValue('email', existingTeacherIssue.email);
        setValue('college', existingTeacherIssue.college);
        setValue('course', existingTeacherIssue.course);
        setIsAutofilled(true);
      }
    }
  }, [watchedTeacherId, issues, setValue, editingIndex]);

  useEffect(() => {
      // If any of the autofilled fields are changed by the user, break the autofill link
      if (isAutofilled) {
        const currentValues = getValues();
        const existingTeacherIssue = issues.find(issue => issue.teacherId === currentValues.teacherId);
        if (existingTeacherIssue) {
            if (
                currentValues.teacherName !== existingTeacherIssue.teacherName ||
                currentValues.mobileNo !== existingTeacherIssue.mobileNo ||
                currentValues.email !== existingTeacherIssue.email ||
                currentValues.college !== existingTeacherIssue.college ||
                currentValues.course !== existingTeacherIssue.course
            ) {
                setIsAutofilled(false);
            }
        }
      }
  }, [watchedTeacherName, watchedCourse, watchedCollege, watchedMobileNo, watchedEmail, isAutofilled, getValues, issues]);

  useEffect(() => {
      if (watchedQpNo && qpUpcMap[watchedQpNo]) {
          setValue('upc', qpUpcMap[watchedQpNo]);
      }
  }, [watchedQpNo, qpUpcMap, setValue]);
  
  const { filteredIssues, totalScripts, totalMissing, totalExtra } = useMemo(() => {
    const filtered = issues.filter(issue => {
        const searchMatch = 
            issue.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.mobileNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (issue.course && issue.course.toLowerCase().includes(searchTerm.toLowerCase()));

        const filterMatch = 
            (filters.dateOfIssue ? issue.dateOfIssue === filters.dateOfIssue : true) &&
            (filters.qpNo && issue.qpNo ? issue.qpNo.toLowerCase().includes(filters.qpNo.toLowerCase()) : !filters.qpNo) &&
            (filters.upc && issue.upc ? issue.upc.toLowerCase().includes(filters.upc.toLowerCase()) : !filters.upc) &&
            (filters.course ? issue.course.toLowerCase().includes(filters.course.toLowerCase()) : true) &&
            (filters.campus.length > 0 ? issue.campus && filters.campus.includes(issue.campus) : true) &&
            (filters.type.length > 0 ? issue.schoolType && filters.type.includes(issue.schoolType) : true) &&
            (filters.teacherId ? issue.teacherId.toLowerCase().includes(filters.teacherId.toLowerCase()) : true) &&
            (filters.teacherName ? issue.teacherName.toLowerCase().includes(filters.teacherName.toLowerCase()) : true);
            
        return searchMatch && filterMatch;
    });

    const totalScripts = filtered.reduce((acc, issue) => acc + (issue.noOfScripts || 0), 0);
    const totalMissing = filtered.reduce((acc, issue) => acc + (issue.noOfMissing || 0), 0);
    const totalExtra = filtered.reduce((acc, issue) => acc + (issue.extraSheets || 0), 0);

    return { filteredIssues: filtered, totalScripts, totalMissing, totalExtra };
  }, [issues, searchTerm, filters]);


  const updateIssuesStateAndLocalStorage = (newIssues: IssueFormValues[]) => {
    const sortedIssues = newIssues.sort((a, b) => new Date(b.dateOfIssue).getTime() - new Date(a.dateOfIssue).getTime());
    setIssues(sortedIssues);
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(sortedIssues));
  };
  
  function onSubmit(data: IssueFormValues) {
    let newIssues;
    const isUpdating = editingIndex !== null;

    if (isUpdating) {
      newIssues = [...issues];
      const existingIssue = newIssues[editingIndex];
      newIssues[editingIndex] = {...data, tokenNo: existingIssue.tokenNo, received: existingIssue.received, noOfAbsent: existingIssue.noOfAbsent, noOfMissing: existingIssue.noOfMissing, extraSheets: existingIssue.extraSheets};
      setEditingIndex(null);
    } else {
        const teacherCourseKey = data.course;
        let currentTokenMap = {...teacherCourseTokenMap};
        let courseTokens = currentTokenMap[teacherCourseKey] || {};
        
        let teacherToken = courseTokens[data.teacherId];

        if (!teacherToken) {
             const lastTokenForCourse = Object.keys(courseTokens).length > 0 ?
                Math.max(0, ...Object.values(courseTokens)) : 0;
            
            teacherToken = lastTokenForCourse + 1;
            courseTokens[data.teacherId] = teacherToken;
            currentTokenMap[teacherCourseKey] = courseTokens;
            
            setTeacherCourseTokenMap(currentTokenMap);
            localStorage.setItem(TEACHER_COURSE_TOKEN_MAP_KEY, JSON.stringify(currentTokenMap));
        }

      newIssues = [...issues, {...data, noOfAbsent: 0, noOfMissing: 0, extraSheets: 0, tokenNo: teacherToken}];
      if (data.qpNo && data.upc && !qpUpcMap[data.qpNo]) {
        const newMap = {...qpUpcMap, [data.qpNo]: data.upc};
        setQpUpcMap(newMap);
        localStorage.setItem(QP_UPC_MAP_KEY, JSON.stringify(newMap));
      }
    }
    updateIssuesStateAndLocalStorage(newIssues);
    form.reset({
      dateOfIssue: "",
      packetNo: "",
      packetFrom: "",
      packetTo: "",
      noOfScripts: undefined,
      qpNo: "",
      upc: "",
      teacherName: "",
      mobileNo: "",
      email: "",
      teacherId: "",
      college: "",
      course: "",
      campus: undefined,
      schoolType: undefined,
      received: false,
      noOfAbsent: 0,
      tokenNo: undefined,
      noOfMissing: 0,
      extraSheets: 0,
    });
    setIsAutofilled(false);
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    form.reset(issues[index]);
  };

  const handleDelete = (index: number) => {
    const issueToDelete = issues[index];
    const newIssues = issues.filter((_, i) => i !== index);
    updateIssuesStateAndLocalStorage(newIssues);

    const storedTrash = localStorage.getItem(TRASH_STORAGE_KEY);
    const trash = storedTrash ? JSON.parse(storedTrash) : [];
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify([...trash, issueToDelete]));
    
    setSelectedIssues([]);
  };

  const handleBulkDelete = () => {
    const issuesToDelete = issues.filter((_, index) => selectedIssues.includes(index));
    const newIssues = issues.filter((_, index) => !selectedIssues.includes(index));
    updateIssuesStateAndLocalStorage(newIssues);
    
    const storedTrash = localStorage.getItem(TRASH_STORAGE_KEY);
    const trash = storedTrash ? JSON.parse(storedTrash) : [];
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify([...trash, ...issuesToDelete]));

    setSelectedIssues([]);
  };

  const handleView = (teacherId: string) => {
    router.push(`/issue-form/${encodeURIComponent(teacherId)}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(issues);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Issues");
    XLSX.writeFile(workbook, "IssueData.xlsx");
  };

  const handleRowDataChange = (index: number, field: keyof IssueFormValues, value: any) => {
    const newIssues = [...issues];
    (newIssues[index] as any)[field] = value;
    setIssues(newIssues);
  };
  
  const handleSaveRow = (index: number) => {
    updateIssuesStateAndLocalStorage(issues);
  }
  
  const handleSelectIssue = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedIssues(prev => [...prev, index]);
    } else {
      setSelectedIssues(prev => prev.filter(i => i !== index));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIssues(filteredIssues.map((issue) => issues.findIndex(i => i.packetNo === issue.packetNo)));
    } else {
      setSelectedIssues([]);
    }
  };
  
  const handleFilterChange = (field: keyof FilterValues, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxFilterChange = (field: 'campus' | 'type', value: string, checked: boolean) => {
    setFilters(prev => {
        const currentValues = prev[field] as string[];
        if (checked) {
            return { ...prev, [field]: [...currentValues, value] };
        } else {
            return { ...prev, [field]: currentValues.filter(v => v !== value) };
        }
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Scripts Issue Form</h1>
        <p className="text-lg text-muted-foreground mt-2">Create and manage teacher issues here.</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
              <CardDescription>Fill in the details for the issue.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <FormField control={form.control} name="dateOfIssue" render={({ field }) => (<FormItem><FormLabel>Date of Issue</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="packetNo" render={({ field }) => (<FormItem><FormLabel>Packet No.</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="packetFrom" render={({ field }) => (<FormItem><FormLabel>From</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="packetTo" render={({ field }) => (<FormItem><FormLabel>To</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="noOfScripts" render={({ field }) => (<FormItem><FormLabel>No. of Scripts</FormLabel><FormControl><Input type="number" placeholder="" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="qpNo" render={({ field }) => (<FormItem><FormLabel>QP No.</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="upc" render={({ field }) => (<FormItem><FormLabel>UPC</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Teacher Details</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <FormField control={form.control} name="teacherId" render={({ field }) => (<FormItem><FormLabel>Teacher ID</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="teacherName" render={({ field }) => (<FormItem><FormLabel>Teacher Name</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="course" render={({ field }) => (<FormItem><FormLabel>Course</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="college" render={({ field }) => (<FormItem><FormLabel>College</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="mobileNo" render={({ field }) => (<FormItem><FormLabel>Mobile No.</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
             <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="campus"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Campus</FormLabel>
                      <FormControl>
                        <div className="flex gap-4">
                           <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value === 'North'} onCheckedChange={(checked) => field.onChange(checked ? 'North' : undefined)} />
                            </FormControl>
                            <FormLabel className="font-normal">North</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value === 'South'} onCheckedChange={(checked) => field.onChange(checked ? 'South' : undefined)} />
                            </FormControl>
                            <FormLabel className="font-normal">South</FormLabel>
                          </FormItem>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="schoolType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                         <div className="flex gap-4">
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value === 'Regular'} onCheckedChange={(checked) => field.onChange(checked ? 'Regular' : undefined)} />
                            </FormControl>
                            <FormLabel className="font-normal">Regular</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                               <Checkbox checked={field.value === 'NCWEB'} onCheckedChange={(checked) => field.onChange(checked ? 'NCWEB' : undefined)} />
                            </FormControl>
                            <FormLabel className="font-normal">NCWEB</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value === 'SOL'} onCheckedChange={(checked) => field.onChange(checked ? 'SOL' : undefined)} />
                            </FormControl>
                            <FormLabel className="font-normal">SOL</FormLabel>
                          </FormItem>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg">{editingIndex !== null ? 'Update Issue' : 'Save'}</Button>
          </div>
        </form>
      </Form>

      {issues.length > 0 && (
        <>
        <Separator className="my-8" />

        <div className="grid md:grid-cols-3 gap-6">
            <Card>
                <CardHeader><CardTitle>Total Scripts Issued</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{totalScripts}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Total Missings</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{totalMissing}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Total Extra Sheets</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{totalExtra}</p></CardContent>
            </Card>
        </div>


        <Card>
          <CardHeader>
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <div>
                <CardTitle>Submitted Issues</CardTitle>
                <CardDescription>View and manage the submitted issues.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Search..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline"><Filter className="mr-2 h-4 w-4"/> Filter</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Filters</h4>
                        <p className="text-sm text-muted-foreground">
                          Filter the issues by the following criteria.
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="dateOfIssue">Date of Issue</Label>
                          <Input id="dateOfIssue" type="date" value={filters.dateOfIssue} onChange={e => handleFilterChange('dateOfIssue', e.target.value)} className="col-span-2 h-8" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="qpNo">QP No.</Label>
                          <Input id="qpNo" value={filters.qpNo} onChange={e => handleFilterChange('qpNo', e.target.value)} className="col-span-2 h-8" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="upc">UPC</Label>
                          <Input id="upc" value={filters.upc} onChange={e => handleFilterChange('upc', e.target.value)} className="col-span-2 h-8" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="course">Course</Label>
                          <Input id="course" value={filters.course} onChange={e => handleFilterChange('course', e.target.value)} className="col-span-2 h-8" />
                        </div>
                         <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="teacherName">Teacher Name</Label>
                          <Input id="teacherName" value={filters.teacherName} onChange={e => handleFilterChange('teacherName', e.target.value)} className="col-span-2 h-8" />
                        </div>
                         <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="teacherId">Teacher ID</Label>
                          <Input id="teacherId" value={filters.teacherId} onChange={e => handleFilterChange('teacherId', e.target.value)} className="col-span-2 h-8" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label>Campus</Label>
                          <div className="col-span-2 flex gap-4">
                            <div className="flex items-center space-x-2"><Checkbox id="filter-campus-north" checked={filters.campus.includes('North')} onCheckedChange={(c) => handleCheckboxFilterChange('campus', 'North', !!c)} /><Label htmlFor="filter-campus-north" className="font-normal">North</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="filter-campus-south" checked={filters.campus.includes('South')} onCheckedChange={(c) => handleCheckboxFilterChange('campus', 'South', !!c)} /><Label htmlFor="filter-campus-south" className="font-normal">South</Label></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 items-start gap-4">
                          <Label>Type</Label>
                           <div className="col-span-2 flex flex-col gap-2">
                            <div className="flex items-center space-x-2"><Checkbox id="filter-type-regular" checked={filters.type.includes('Regular')} onCheckedChange={(c) => handleCheckboxFilterChange('type', 'Regular', !!c)} /><Label htmlFor="filter-type-regular" className="font-normal">Regular</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="filter-type-ncweb" checked={filters.type.includes('NCWEB')} onCheckedChange={(c) => handleCheckboxFilterChange('type', 'NCWEB', !!c)} /><Label htmlFor="filter-type-ncweb" className="font-normal">NCWEB</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="filter-type-sol" checked={filters.type.includes('SOL')} onCheckedChange={(c) => handleCheckboxFilterChange('type', 'SOL', !!c)} /><Label htmlFor="filter-type-sol" className="font-normal">SOL</Label></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                {selectedIssues.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected ({selectedIssues.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will move {selectedIssues.length} issue(s) to the trash. You can restore them later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button onClick={handleExport}><FileDown className="mr-2 h-4 w-4" />Export to Excel</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             {selectedIssues.length > 0 && (
              <div className="mb-4 flex items-center gap-4 rounded-md bg-muted p-3">
                 <p className="text-sm font-medium">{selectedIssues.length} issue(s) selected.</p>
               </div>
             )}
             <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      onCheckedChange={handleSelectAll}
                      checked={selectedIssues.length === filteredIssues.length && filteredIssues.length > 0}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Token No.</TableHead>
                  <TableHead>Teacher Name / ID</TableHead>
                  <TableHead>Date of Issue</TableHead>
                  <TableHead>Packet No.</TableHead>
                  <TableHead>QP No.</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>No. of Scripts</TableHead>
                  <TableHead>No. of Absent</TableHead>
                  <TableHead>Missing</TableHead>
                  <TableHead>Extra Sheets</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue) => {
                  const originalIndex = issues.findIndex(i => i.packetNo === issue.packetNo);
                  const isSelected = selectedIssues.includes(originalIndex);
                  return (
                  <TableRow key={originalIndex} data-state={isSelected && "selected"}>
                    <TableCell onClick={(e) => { e.stopPropagation(); }}>
                      <Checkbox
                        onCheckedChange={(checked) => handleSelectIssue(originalIndex, !!checked)}
                        checked={isSelected}
                        aria-label={`Select row ${originalIndex + 1}`}
                      />
                    </TableCell>
                    <TableCell>{issue.tokenNo}</TableCell>
                    <TableCell>{issue.teacherName}<br/><span className="text-xs text-muted-foreground">{issue.teacherId}</span></TableCell>
                    <TableCell>{issue.dateOfIssue}</TableCell>
                    <TableCell>{issue.packetNo}</TableCell>
                    <TableCell>{issue.qpNo}</TableCell>
                    <TableCell>{issue.course}</TableCell>
                    <TableCell>{issue.packetFrom} - {issue.packetTo}</TableCell>
                    <TableCell>{issue.schoolType}</TableCell>
                    <TableCell>{issue.campus}</TableCell>
                    <TableCell>{issue.noOfScripts}</TableCell>
                     <TableCell onClick={(e) => e.stopPropagation()}>
                      <Input 
                        type="number" 
                        value={issue.noOfAbsent || ''} 
                        onChange={(e) => handleRowDataChange(originalIndex, 'noOfAbsent', parseInt(e.target.value, 10) || 0)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                        <Input
                            type="number"
                            value={issue.noOfMissing || ''}
                            onChange={(e) => handleRowDataChange(originalIndex, 'noOfMissing', parseInt(e.target.value, 10) || 0)}
                            className="w-20"
                        />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                        <Input
                            type="number"
                            value={issue.extraSheets || ''}
                            onChange={(e) => handleRowDataChange(originalIndex, 'extraSheets', parseInt(e.target.value, 10) || 0)}
                            className="w-20"
                        />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`received-${originalIndex}`}
                          checked={issue.received}
                          onCheckedChange={(checked) => handleRowDataChange(originalIndex, 'received', !!checked)}
                        />
                        <Label htmlFor={`received-${originalIndex}`} className="sr-only">Received</Label>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleView(issue.teacherId)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleSaveRow(originalIndex)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleEdit(originalIndex)}>
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
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will move this issue to the trash. You can restore it later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(originalIndex)}>Continue</AlertDialogAction>
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
        </>
      )}
    </div>
  );
}

    