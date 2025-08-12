
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Edit, Trash2, Printer, FileDown, Search, Save, Eye, Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const issueFormSchema = z.object({
  dateOfIssue: z.string().min(1, "Date of Issue is required"),
  packetNo: z.string().min(1, "Packet No. is required"),
  packetFrom: z.string().min(1, "Packet No. (From) is required"),
  packetTo: z.string().min(1, "Packet No. (To) is required"),
  noOfScripts: z.coerce.number().min(1, "Number of Scripts must be at least 1"),
  qpNo: z.string().min(1, "QP No. is required"),
  upc: z.string().min(1, "UPC is required"),
  teacherName: z.string().min(1, "Teacher Name is required"),
  mobileNo: z.string().min(1, "Mobile No. is required"),
  email: z.string().email("Invalid email address"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  college: z.string().min(1, "College is required"),
  campus: z.enum(["North", "South"]).optional(),
  schoolType: z.enum(["Regular", "NCWEB", "SOL"]).optional(),
  received: z.boolean().default(false),
  noOfAbsent: z.coerce.number().optional(),
});

export type IssueFormValues = z.infer<typeof issueFormSchema>;

const ISSUES_STORAGE_KEY = 'cec068_issues';
const TRASH_STORAGE_KEY = 'cec068_trash';
const QP_UPC_MAP_KEY = 'cec068_qp_upc_map';

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
  campus: ("North" | "South")[];
  type: ("Regular" | "NCWEB" | "SOL")[];
  teacherId: string;
  teacherName: string;
};


export default function IssueFormPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [issues, setIssues] = useState<IssueFormValues[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<number[]>([]);
  const [qpUpcMap, setQpUpcMap] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<FilterValues>({
    dateOfIssue: "",
    qpNo: "",
    upc: "",
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
      campus: undefined,
      schoolType: undefined,
      received: false,
      noOfAbsent: 0,
    },
  });

  const { watch, setValue } = form;
  const watchedTeacherId = watch('teacherId');
  const watchedQpNo = watch('qpNo');

  useEffect(() => {
    if (watchedTeacherId && editingIndex === null) {
      const existingTeacherIssue = issues.find(issue => issue.teacherId === watchedTeacherId);
      if (existingTeacherIssue) {
        setValue('teacherName', existingTeacherIssue.teacherName);
        setValue('mobileNo', existingTeacherIssue.mobileNo);
        setValue('email', existingTeacherIssue.email);
        setValue('college', existingTeacherIssue.college);
      }
    }
  }, [watchedTeacherId, issues, setValue, editingIndex]);

  useEffect(() => {
      if (watchedQpNo && qpUpcMap[watchedQpNo]) {
          setValue('upc', qpUpcMap[watchedQpNo]);
      }
  }, [watchedQpNo, qpUpcMap, setValue]);
  
  const filteredIssues = issues.filter(issue => {
    const searchMatch = 
        issue.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.mobileNo.toLowerCase().includes(searchTerm.toLowerCase());

    const filterMatch = 
        (filters.dateOfIssue ? issue.dateOfIssue === filters.dateOfIssue : true) &&
        (filters.qpNo ? issue.qpNo.toLowerCase().includes(filters.qpNo.toLowerCase()) : true) &&
        (filters.upc ? issue.upc.toLowerCase().includes(filters.upc.toLowerCase()) : true) &&
        (filters.campus.length > 0 ? issue.campus && filters.campus.includes(issue.campus) : true) &&
        (filters.type.length > 0 ? issue.schoolType && filters.type.includes(issue.schoolType) : true) &&
        (filters.teacherId ? issue.teacherId.toLowerCase().includes(filters.teacherId.toLowerCase()) : true) &&
        (filters.teacherName ? issue.teacherName.toLowerCase().includes(filters.teacherName.toLowerCase()) : true);
        
    return searchMatch && filterMatch;
  });

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
      newIssues[editingIndex] = {...data, received: existingIssue.received, noOfAbsent: existingIssue.noOfAbsent};
      setEditingIndex(null);
      toast({
        title: "Message Sent",
        description: `From CEC-068 SGTB Khalsa College: Packet details updated for Packet No. ${data.packetNo}.`,
      });
    } else {
      newIssues = [...issues, {...data, noOfAbsent: 0}];
      // Update QP-UPC Map
      if (!qpUpcMap[data.qpNo]) {
        const newMap = {...qpUpcMap, [data.qpNo]: data.upc};
        setQpUpcMap(newMap);
        localStorage.setItem(QP_UPC_MAP_KEY, JSON.stringify(newMap));
      }

      toast({
        title: "Message Sent",
        description: `From CEC-068 SGTB Khalsa College: Packet issue details saved for Packet No. ${data.packetNo}.`,
      });
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
      campus: undefined,
      schoolType: undefined,
      received: false,
      noOfAbsent: 0,
    });
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

    toast({
      title: "Issue Deleted",
      description: "The issue has been moved to the trash.",
    });
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
    const oldIssue = newIssues[index];
    (newIssues[index] as any)[field] = value;
    setIssues(newIssues);

    if (field === 'received' && value === true) {
         toast({
            title: "Message Sent",
            description: `From CEC-068 SGTB Khalsa College: Packet No. ${oldIssue.packetNo} received.`,
        });
    }
  };
  
  const handleSaveRow = (index: number) => {
    updateIssuesStateAndLocalStorage(issues);
    const issue = issues[index];
    toast({
      title: "Message Sent",
      description: `From CEC-068 SGTB Khalsa College: Details updated for Packet No. ${issue.packetNo}. Absents: ${issue.noOfAbsent}, Received: ${issue.received ? 'Yes' : 'No'}.`
    });
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
      setSelectedIssues(filteredIssues.map((_, index) => issues.findIndex(i => i.teacherId === filteredIssues[index].teacherId && i.packetNo === filteredIssues[index].packetNo)));
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
        <h1 className="text-4xl font-bold tracking-tight font-headline">Issue Form</h1>
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
              <FormField control={form.control} name="noOfScripts" render={({ field }) => (<FormItem><FormLabel>No. of Scripts</FormLabel><FormControl><Input type="number" placeholder="" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="qpNo" render={({ field }) => (<FormItem><FormLabel>QP No.</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="upc" render={({ field }) => (<FormItem><FormLabel>UPC</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Teacher Details</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <FormField control={form.control} name="teacherId" render={({ field }) => (<FormItem><FormLabel>Teacher ID</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="teacherName" render={({ field }) => (<FormItem><FormLabel>Teacher Name</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
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
            <Button type="submit" size="lg">{editingIndex !== null ? 'Update Issue' : 'Save Issue'}</Button>
          </div>
        </form>
      </Form>

      {issues.length > 0 && (
        <>
        <Separator className="my-8" />
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center gap-4">
              <div>
                <CardTitle>Submitted Issues</CardTitle>
                <CardDescription>View and manage the submitted issues.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Search by teacher..." 
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
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={filters.campus.includes('North')} onCheckedChange={(c) => handleCheckboxFilterChange('campus', 'North', !!c)} /></FormControl><FormLabel className="font-normal">North</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={filters.campus.includes('South')} onCheckedChange={(c) => handleCheckboxFilterChange('campus', 'South', !!c)} /></FormControl><FormLabel className="font-normal">South</FormLabel></FormItem>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label>Type</Label>
                          <div className="col-span-2 flex gap-2">
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={filters.type.includes('Regular')} onCheckedChange={(c) => handleCheckboxFilterChange('type', 'Regular', !!c)} /></FormControl><FormLabel className="font-normal">Regular</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={filters.type.includes('NCWEB')} onCheckedChange={(c) => handleCheckboxFilterChange('type', 'NCWEB', !!c)} /></FormControl><FormLabel className="font-normal">NCWEB</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={filters.type.includes('SOL')} onCheckedChange={(c) => handleCheckboxFilterChange('type', 'SOL', !!c)} /></FormControl><FormLabel className="font-normal">SOL</FormLabel></FormItem>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                <Button onClick={handleExport}><FileDown className="mr-2 h-4 w-4" />Export to Excel</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                  <TableHead>Teacher Name / ID</TableHead>
                  <TableHead>Date of Issue</TableHead>
                  <TableHead>Packet No.</TableHead>
                  <TableHead>QP No.</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>No. of Scripts</TableHead>
                  <TableHead>No. of Absent</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue, index) => {
                  const originalIndex = issues.findIndex(i => i.teacherId === issue.teacherId && i.packetNo === issue.packetNo);
                  const isSelected = selectedIssues.includes(originalIndex);
                  return (
                  <TableRow key={originalIndex} data-state={isSelected && "selected"}>
                    <TableCell>
                      <Checkbox
                        onCheckedChange={(checked) => handleSelectIssue(originalIndex, !!checked)}
                        checked={isSelected}
                        aria-label={`Select row ${originalIndex + 1}`}
                      />
                    </TableCell>
                    <TableCell>{issue.teacherName}<br/><span className="text-xs text-muted-foreground">{issue.teacherId}</span></TableCell>
                    <TableCell>{issue.dateOfIssue}</TableCell>
                    <TableCell>{issue.packetNo}</TableCell>
                    <TableCell>{issue.qpNo}</TableCell>
                    <TableCell>{issue.packetFrom} - {issue.packetTo}</TableCell>
                    <TableCell>{issue.schoolType}</TableCell>
                    <TableCell>{issue.campus}</TableCell>
                    <TableCell>{issue.noOfScripts}</TableCell>
                     <TableCell>
                      <Input 
                        type="number" 
                        value={issue.noOfAbsent || ''} 
                        onChange={(e) => handleRowDataChange(originalIndex, 'noOfAbsent', parseInt(e.target.value, 10) || 0)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`received-${originalIndex}`}
                          checked={issue.received}
                          onCheckedChange={(checked) => handleRowDataChange(originalIndex, 'received', !!checked)}
                        />
                        <Label htmlFor={`received-${originalIndex}`} className="sr-only">Received</Label>
                      </div>
                    </TableCell>
                    <TableCell>
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
