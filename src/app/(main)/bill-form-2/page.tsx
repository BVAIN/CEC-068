
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import QRCode from "qrcode.react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Trash2, Upload, Edit, Search, FileDown, Filter, Share2, Copy, PencilRuler } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { BILLS_STORAGE_KEY_2, BILLS_FILE_NAME_2 } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const billFormSchema = z.object({
  id: z.string().optional(),
  evaluatorId: z.string().min(1, "Evaluator ID is required"),
  evaluatorName: z.string().min(1, "Evaluator Name is required"),
  collegeName: z.string().min(1, "College Name is required"),
  course: z.string().min(1, "Course is required"),
  email: z.string().email("A valid email is required"),
  panNo: z.string().min(1, "PAN No. is required"),
  address: z.string().min(1, "Address is required"),
  distance: z.coerce.number().min(0, "Distance must be a positive number"),
  mobileNo: z.string().min(1, "Mobile No. is required"),
  bankName: z.string().min(1, "Bank Name is required"),
  branch: z.string().min(1, "Branch is required"),
  bankAccountNo: z.string().min(1, "Bank Account No. is required"),
  ifscCode: z.string().min(1, "IFSC Code is required"),
  signature: z.string().optional(),
});

export type BillFormValues = z.infer<typeof billFormSchema>;

type FilterValues = Partial<Omit<BillFormValues, 'id' | 'signature' | 'distance'>> & { distance: string };

const editableFields = [
    { value: 'evaluatorId', label: 'Evaluator ID' },
    { value: 'evaluatorName', label: 'Evaluator Name' },
    { value: 'collegeName', label: 'College Name' },
    { value: 'course', label: 'Course' },
    { value: 'email', label: 'Email ID' },
    { value: 'panNo', label: 'PAN No.' },
    { value: 'address', label: 'Address' },
    { value: 'distance', label: 'Distance (Km)' },
    { value: 'mobileNo', label: 'Mobile No.' },
    { value: 'bankName', label: 'Bank Name' },
    { value: 'branch', label: 'Branch' },
    { value: 'bankAccountNo', label: 'Bank Account No.' },
    { value: 'ifscCode', label: 'IFSC Code' },
] as const;

type EditableField = typeof editableFields[number]['value'];

export default function BillForm2Page() {
  const router = useRouter();
  const { toast } = useToast();
  const [bills, setBills] = useState<BillFormValues[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterValues>({});
  const [publicFormUrl, setPublicFormUrl] = useState("");
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditField, setBulkEditField] = useState<EditableField>('course');
  const [bulkEditValue, setBulkEditValue] = useState('');


  const { isConnected, files, readFile, writeFile } = useGoogleDrive();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicFormUrl(`${window.location.origin}/entry`);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (isConnected) {
        try {
          const fileContent = await readFile(BILLS_FILE_NAME_2);
          if (fileContent) {
            const driveBills = JSON.parse(fileContent);
            setBills(driveBills);
            localStorage.setItem(BILLS_STORAGE_KEY_2, JSON.stringify(driveBills));
          } else {
            // If no file on drive, check local storage
            const localBills = localStorage.getItem(BILLS_STORAGE_KEY_2);
            if (localBills) {
              setBills(JSON.parse(localBills));
            }
          }
        } catch (e) {
            console.error("Failed to load from Drive, using local fallback", e);
            const localBills = localStorage.getItem(BILLS_STORAGE_KEY_2);
            if (localBills) setBills(JSON.parse(localBills));
        }
      } else {
         const localBills = localStorage.getItem(BILLS_STORAGE_KEY_2);
         if (localBills) setBills(JSON.parse(localBills));
      }
    };
    loadData();
  }, [isConnected, readFile]);

  const filteredBills = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    return bills.filter(bill => {
        const searchMatch =
            bill.evaluatorName.toLowerCase().includes(lowercasedTerm) ||
            bill.evaluatorId.toLowerCase().includes(lowercasedTerm) ||
            bill.mobileNo.toLowerCase().includes(lowercasedTerm) ||
            bill.email.toLowerCase().includes(lowercasedTerm);

        const filterMatch = Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            const billValue = bill[key as keyof BillFormValues];
            if (typeof billValue === 'string') {
                return billValue.toLowerCase().includes((value as string).toLowerCase());
            }
            if (typeof billValue === 'number') {
                return billValue.toString().includes(value as string);
            }
            return true;
        });

        return searchMatch && filterMatch;
    });
  }, [bills, searchTerm, filters]);


  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      id: undefined,
      evaluatorId: "",
      evaluatorName: "",
      collegeName: "",
      course: "",
      email: "",
      panNo: "",
      address: "",
      distance: undefined,
      mobileNo: "",
      bankName: "",
      branch: "",
      bankAccountNo: "",
      ifscCode: "",
      signature: "",
    },
  });
  
  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        form.setValue('signature', result);
        setSignaturePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };


  const updateBillsStateAndStorage = async (newBills: BillFormValues[]) => {
    setBills(newBills);
    localStorage.setItem(BILLS_STORAGE_KEY_2, JSON.stringify(newBills));
    if (isConnected) {
        try {
            await writeFile(BILLS_FILE_NAME_2, JSON.stringify(newBills, null, 2));
        } catch (e) {
            console.error("Failed to save to drive", e);
            toast({ variant: "destructive", title: "Sync Error", description: "Could not save bill to Google Drive."});
        }
    }
  };


  async function onSubmit(data: BillFormValues) {
    let newBills;
    if (editingId) {
        newBills = bills.map(bill => bill.id === editingId ? { ...data, id: editingId } : bill);
        setEditingId(null);
    } else {
        const newBill = { ...data, id: `${Date.now()}-${data.evaluatorId}` };
        newBills = [...bills, newBill];
    }
    await updateBillsStateAndStorage(newBills);
    toast({ title: editingId ? "Bill Updated" : "Bill Saved", description: "The bill details have been saved successfully." });
    form.reset();
    setSignaturePreview(null);
  }
  
  const handleView = (evaluatorId: string) => {
    router.push(`/bill-form-2/${encodeURIComponent(evaluatorId)}`);
  };

  const handleDelete = async (ids: string[]) => {
    const newBills = bills.filter(bill => !ids.includes(bill.id!));
    await updateBillsStateAndStorage(newBills);
    toast({ title: "Bill(s) Deleted", description: "The selected bills have been removed." });
    setSelectedBills([]);
  };

  const handleEdit = (bill: BillFormValues) => {
    setEditingId(bill.id!);
    form.reset(bill);
    setSignaturePreview(bill.signature || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleSelectBill = (billId: string, checked: boolean) => {
    if (checked) {
      setSelectedBills(prev => [...prev, billId]);
    } else {
      setSelectedBills(prev => prev.filter(id => id !== billId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBills(filteredBills.map((bill) => bill.id || '').filter(id => id));
    } else {
      setSelectedBills([]);
    }
  };

  const handleExport = () => {
    const dataToExport = bills.map(bill => {
        const { signature, ...rest } = bill;
        return rest;
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bills");
    XLSX.writeFile(workbook, "BillsData.xlsx");
  };

  const handleFilterChange = (field: keyof FilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(publicFormUrl);
    toast({ title: "Copied!", description: "The link has been copied to your clipboard." });
  };
  
  const handleBulkUpdate = async () => {
    const valueToSet = bulkEditField === 'distance' ? Number(bulkEditValue) : bulkEditValue;
    const newBills = bills.map(bill => {
      if (selectedBills.includes(bill.id!)) {
        return { ...bill, [bulkEditField]: valueToSet };
      }
      return bill;
    });
    await updateBillsStateAndStorage(newBills);
    toast({ title: 'Bills Updated', description: `${selectedBills.length} bill(s) have been updated.` });
    setSelectedBills([]);
    setIsBulkEditOpen(false);
    setBulkEditValue('');
  };


  const filterFields: { name: keyof FilterValues, label: string, type: string }[] = [
    { name: 'evaluatorId', label: 'Evaluator ID', type: 'text' },
    { name: 'evaluatorName', label: 'Evaluator Name', type: 'text' },
    { name: 'collegeName', label: 'College Name', type: 'text' },
    { name: 'course', label: 'Course', type: 'text' },
    { name: 'email', label: 'Email ID', type: 'email' },
    { name: 'mobileNo', label: 'Mobile No.', type: 'text' },
    { name: 'address', label: 'Address', type: 'text' },
    { name: 'distance', label: 'Distance (Km)', type: 'number' },
    { name: 'bankName', label: 'Bank Name', type: 'text' },
    { name: 'branch', label: 'Branch', type: 'text' },
    { name: 'bankAccountNo', label: 'Bank Account No.', type: 'text' },
    { name: 'ifscCode', label: 'IFSC Code', type: 'text' },
    { name: 'panNo', label: 'PAN No.', type: 'text' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Bill Form 2</h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Update Bill' : 'New Bill Entry'}</CardTitle>
              <CardDescription>Fill in the evaluator's details to create a bill.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
                <FormField control={form.control} name="evaluatorId" render={({ field }) => (<FormItem><FormLabel>Evaluator ID</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="evaluatorName" render={({ field }) => (<FormItem><FormLabel>Evaluator Name</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="collegeName" render={({ field }) => (<FormItem><FormLabel>College Name</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="course" render={({ field }) => (<FormItem><FormLabel>Course</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email ID</FormLabel><FormControl><Input type="email" placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="mobileNo" render={({ field }) => (<FormItem><FormLabel>Mobile No.</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="distance" render={({ field }) => (<FormItem><FormLabel>Distance (Km) Up-Down</FormLabel><FormControl><Input type="number" placeholder="" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
                <CardTitle>Bank Details</CardTitle>
             </CardHeader>
             <CardContent className="grid md:grid-cols-3 gap-6">
                <FormField control={form.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bankAccountNo" render={({ field }) => (<FormItem><FormLabel>Bank Account No.</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="ifscCode" render={({ field }) => (<FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="panNo" render={({ field }) => (<FormItem><FormLabel>PAN No.</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <div className="space-y-2">
                    <FormLabel>Signature of examiner</FormLabel>
                    <Input id="signature-upload" type="file" accept="image/jpeg,image/jpg,application/pdf" onChange={handleSignatureUpload} className="hidden" />
                    <Button type="button" onClick={() => document.getElementById('signature-upload')?.click()} variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                    </Button>
                    {signaturePreview && <img src={signaturePreview} alt="Signature Preview" className="mt-2 h-20 border rounded-md" />}
                </div>
             </CardContent>
          </Card>
           <div className="flex justify-end gap-4">
             {editingId && <Button type="button" variant="outline" size="lg" onClick={() => { setEditingId(null); form.reset(); setSignaturePreview(null); }}>Cancel Edit</Button>}
            <Button type="submit" size="lg">{editingId ? 'Update Bill' : 'Save Bill'}</Button>
          </div>
        </form>
      </Form>

       {bills.length > 0 && (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center gap-4 flex-wrap">
                    <div>
                        <CardTitle>Submitted Bills ({filteredBills.length})</CardTitle>
                        <CardDescription>View and manage submitted bill forms.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                            placeholder="Search by name, ID, mobile..." 
                            className="pl-10 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline"><Filter className="mr-2 h-4 w-4"/> Filter</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto">
                                <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Filters</h4>
                                    <p className="text-sm text-muted-foreground">
                                    Filter bills by the following criteria.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    {filterFields.map(field => (
                                        <div key={field.name} className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                                            <Input
                                                id={`filter-${field.name}`}
                                                type={field.type}
                                                value={filters[field.name] || ''}
                                                onChange={(e) => handleFilterChange(field.name, e.target.value)}
                                                className="col-span-2 h-8"
                                            />
                                        </div>
                                    ))}
                                </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {selectedBills.length > 0 && (
                            <>
                            <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline"><PencilRuler className="mr-2 h-4 w-4" />Bulk Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Bulk Edit Bills</DialogTitle>
                                        <DialogDescription>Update a field for all {selectedBills.length} selected bills.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="bulk-edit-field" className="text-right">Field</Label>
                                            <Select value={bulkEditField} onValueChange={(v) => setBulkEditField(v as EditableField)}>
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select a field" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {editableFields.map(field => (
                                                        <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="bulk-edit-value" className="text-right">New Value</Label>
                                            <Input
                                                id="bulk-edit-value"
                                                value={bulkEditValue}
                                                onChange={(e) => setBulkEditValue(e.target.value)}
                                                className="col-span-3"
                                                type={bulkEditField === 'distance' ? 'number' : 'text'}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsBulkEditOpen(false)}>Cancel</Button>
                                        <Button type="button" onClick={handleBulkUpdate}>Update Bills</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete ({selectedBills.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete {selectedBills.length} bill(s).
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(selectedBills)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                            </>
                        )}
                        <Button onClick={handleExport}><FileDown className="mr-2 h-4 w-4" /> Export to Excel</Button>
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button><Share2 className="mr-2 h-4 w-4" /> Share Form</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                <DialogTitle>Share Public Form</DialogTitle>
                                <DialogDescription>
                                    Anyone with this link can submit their bill information.
                                </DialogDescription>
                                </DialogHeader>
                                <div className="flex items-center space-x-2">
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="link" className="sr-only">
                                    Link
                                    </Label>
                                    <Input
                                    id="link"
                                    defaultValue={publicFormUrl}
                                    readOnly
                                    />
                                </div>
                                <Button type="button" size="sm" className="px-3" onClick={handleCopyToClipboard}>
                                    <span className="sr-only">Copy</span>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                </div>
                                <div className="flex justify-center p-4 bg-white rounded-md">
                                    <QRCode value={publicFormUrl} size={200} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                     <Checkbox
                                      onCheckedChange={handleSelectAll}
                                      checked={filteredBills.length > 0 && selectedBills.length === filteredBills.length}
                                      aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>S. No.</TableHead>
                                <TableHead>Evaluator ID</TableHead>
                                <TableHead>Evaluator Name</TableHead>
                                <TableHead>Mobile No.</TableHead>
                                <TableHead>Bank Account No.</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBills.map((bill, index) => (
                                <TableRow key={bill.id} data-state={selectedBills.includes(bill.id!) ? "selected" : "unselected"}>
                                    <TableCell>
                                        <Checkbox
                                          onCheckedChange={(checked) => bill.id && handleSelectBill(bill.id, !!checked)}
                                          checked={bill.id ? selectedBills.includes(bill.id) : false}
                                          aria-label={`Select bill for ${bill.evaluatorName}`}
                                          disabled={!bill.id}
                                        />
                                    </TableCell>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{bill.evaluatorId}</TableCell>
                                    <TableCell>{bill.evaluatorName}</TableCell>
                                    <TableCell>{bill.mobileNo}</TableCell>
                                    <TableCell>{bill.bankAccountNo}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleView(bill.evaluatorId)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                             <Button variant="outline" size="icon" onClick={() => handleEdit(bill)}>
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
                                                        This action will permanently delete this bill. This cannot be undone.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete([bill.id!])}>Continue</AlertDialogAction>
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
            </CardContent>
        </Card>
      )}
    </div>
  );
}
