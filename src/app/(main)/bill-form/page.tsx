
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Trash2, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


const billFormSchema = z.object({
  id: z.string().optional(),
  evaluatorId: z.string().min(1, "Evaluator ID is required"),
  evaluatorName: z.string().min(1, "Evaluator Name is required"),
  collegeName: z.string().min(1, "College Name is required"),
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

const BILLS_STORAGE_KEY = 'cec068_bills';

export default function BillFormPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [bills, setBills] = useState<BillFormValues[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
      if (storedBills) {
        setBills(JSON.parse(storedBills));
      }
    } catch (error) {
      console.error("Error parsing localStorage data for bills:", error);
      localStorage.removeItem(BILLS_STORAGE_KEY);
    }
  }, []);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      id: undefined,
      evaluatorId: "",
      evaluatorName: "",
      collegeName: "",
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


  const updateBillsStateAndLocalStorage = (newBills: BillFormValues[]) => {
    setBills(newBills);
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(newBills));
  };


  function onSubmit(data: BillFormValues) {
    let newBills;
    if (editingId) {
        newBills = bills.map(bill => bill.id === editingId ? { ...data, id: editingId } : bill);
        setEditingId(null);
    } else {
        const newBill = { ...data, id: `${Date.now()}-${data.evaluatorId}` };
        newBills = [...bills, newBill];
    }
    updateBillsStateAndLocalStorage(newBills);
    toast({ title: editingId ? "Bill Updated" : "Bill Saved", description: "The bill details have been saved successfully." });
    form.reset();
    setSignaturePreview(null);
  }
  
  const handleView = (evaluatorId: string) => {
    router.push(`/bill-form/${encodeURIComponent(evaluatorId)}`);
  };

  const handleDelete = (id: string) => {
    const newBills = bills.filter(bill => bill.id !== id);
    updateBillsStateAndLocalStorage(newBills);
    toast({ title: "Bill Deleted", description: "The bill has been removed." });
  };


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Bill Form</h1>
        <p className="text-lg text-muted-foreground mt-2">Manage your bill submissions here.</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Update Bill' : 'New Bill Entry'}</CardTitle>
              <CardDescription>Fill in the evaluator's details to create a bill.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
                <FormField control={form.control} name="evaluatorId" render={({ field }) => (<FormItem><FormLabel>Evaluator ID</FormLabel><FormControl><Input placeholder="e.g., 12345" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="evaluatorName" render={({ field }) => (<FormItem><FormLabel>Evaluator Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="collegeName" render={({ field }) => (<FormItem><FormLabel>College Name</FormLabel><FormControl><Input placeholder="e.g., Khalsa College" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email ID</FormLabel><FormControl><Input type="email" placeholder="e.g., john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="panNo" render={({ field }) => (<FormItem><FormLabel>PAN No.</FormLabel><FormControl><Input placeholder="e.g., ABCDE1234F" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="mobileNo" render={({ field }) => (<FormItem><FormLabel>Mobile No.</FormLabel><FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Input placeholder="e.g., 123 Main St, New Delhi" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="distance" render={({ field }) => (<FormItem><FormLabel>Distance (Km) Up-Down</FormLabel><FormControl><Input type="number" placeholder="e.g., 50" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
                <CardTitle>Bank Details</CardTitle>
             </CardHeader>
             <CardContent className="grid md:grid-cols-3 gap-6">
                <FormField control={form.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g., State Bank of India" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="e.g., Connaught Place" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bankAccountNo" render={({ field }) => (<FormItem><FormLabel>Bank Account No.</FormLabel><FormControl><Input placeholder="e.g., 12345678901" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="ifscCode" render={({ field }) => (<FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input placeholder="e.g., SBIN0000001" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <div className="space-y-2">
                    <FormLabel>Upload Signature</FormLabel>
                    <Input id="signature-upload" type="file" accept="image/jpeg,image/jpg,application/pdf" onChange={handleSignatureUpload} className="hidden" />
                    <Button type="button" onClick={() => document.getElementById('signature-upload')?.click()} variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                    </Button>
                    {signaturePreview && <img src={signaturePreview} alt="Signature Preview" className="mt-2 h-20 border rounded-md" />}
                </div>
             </CardContent>
          </Card>
           <div className="flex justify-end">
            <Button type="submit" size="lg">{editingId ? 'Update Bill' : 'Save Bill'}</Button>
          </div>
        </form>
      </Form>

       {bills.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Submitted Bills</CardTitle>
                <CardDescription>View and manage submitted bill forms.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Evaluator ID</TableHead>
                                <TableHead>Evaluator Name</TableHead>
                                <TableHead>Mobile No.</TableHead>
                                <TableHead>Bank Account No.</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bills.map((bill) => (
                                <TableRow key={bill.id}>
                                    <TableCell>{bill.evaluatorId}</TableCell>
                                    <TableCell>{bill.evaluatorName}</TableCell>
                                    <TableCell>{bill.mobileNo}</TableCell>
                                    <TableCell>{bill.bankAccountNo}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleView(bill.evaluatorId)}>
                                                <Eye className="h-4 w-4" />
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
                                                    <AlertDialogAction onClick={() => handleDelete(bill.id!)}>Continue</AlertDialogAction>
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

    