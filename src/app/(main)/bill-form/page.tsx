
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import QRCode from "qrcode.react";
import { saveAs } from "file-saver";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Trash2, Upload, Edit, Search, FileDown, Filter, Share2, Copy, PencilRuler, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { BILLS_STORAGE_KEY, BILLS_FILE_NAME, BILL_TRASH_STORAGE_KEY } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";


const billFormSchema = z.object({
  id: z.string().optional(),
  evaluatorId: z.string().min(1, "Evaluator ID is required"),
  evaluatorName: z.string().min(1, "Evaluator Name is required"),
  collegeName: z.string().min(1, "College Name is required"),
  course: z.string().min(1, "Course is required"),
  email: z.string().email("A valid email is required"),
  panNo: z.string().min(1, "PAN No. is required"),
  address: z.string().min(1, "Address is required"),
  distance: z.coerce.number().min(1, "Distance is required"),
  mobileNo: z.string().regex(/^\d+$/, "Mobile No. must contain only digits.").min(1, "Mobile No. is required"),
  bankName: z.string().min(1, "Bank Name is required"),
  branch: z.string().min(1, "Branch is required"),
  bankAccountNo: z.string().regex(/^\d+$/, "Bank Account No. must contain only digits.").min(1, "Bank Account No. is required"),
  ifscCode: z.string().min(1, "IFSC Code is required"),
  signature: z.string().min(1, "Signature is required"),
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

export default function BillFormPage() {
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
  const [bulkFindValue, setBulkFindValue] = useState('');
  const [bulkReplaceValue, setBulkReplaceValue] = useState('');


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
          const fileContent = await readFile(BILLS_FILE_NAME);
          if (fileContent) {
            const driveBills = JSON.parse(fileContent);
            setBills(driveBills);
            localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(driveBills));
          } else {
            // If no file on drive, check local storage
            const localBills = localStorage.getItem(BILLS_STORAGE_KEY);
            if (localBills) {
              setBills(JSON.parse(localBills));
            }
          }
        } catch (e) {
            console.error("Failed to load from Drive, using local fallback", e);
            const localBills = localStorage.getItem(BILLS_STORAGE_KEY);
            if (localBills) setBills(JSON.parse(localBills));
        }
      } else {
         const localBills = localStorage.getItem(BILLS_STORAGE_KEY);
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
    try {
        localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(newBills));
    } catch (e) {
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            toast({
                variant: 'destructive',
                title: 'Storage Full',
                description: 'Browser storage is full. Please clear some space or export and delete old bills.'
            });
        } else {
            console.error("Failed to save to localStorage", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save bills locally.' });
        }
    }

    if (isConnected) {
        try {
            await writeFile(BILLS_FILE_NAME, JSON.stringify(newBills, null, 2));
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
        toast({ title: "Bill Updated", description: "The bill details have been updated successfully." });
        setEditingId(null);
    } else {
        const newBill = { ...data, id: `${Date.now()}-${data.evaluatorId}` };
        newBills = [...bills, newBill];
        toast({ title: "Bill Saved", description: "The bill details have been saved successfully." });
    }
    await updateBillsStateAndStorage(newBills);
    form.reset();
    setSignaturePreview(null);
  }
  
  const handleView = (evaluatorId: string) => {
    router.push(`/bill-form/${encodeURIComponent(evaluatorId)}`);
  };

  const handleDelete = async (ids: string[]) => {
    const billsToDelete = bills.filter(bill => ids.includes(bill.id!));
    const newBills = bills.filter(bill => !ids.includes(bill.id!));
    await updateBillsStateAndStorage(newBills);

    const storedTrash = localStorage.getItem(BILL_TRASH_STORAGE_KEY);
    const trash = storedTrash ? JSON.parse(storedTrash) : [];
    localStorage.setItem(BILL_TRASH_STORAGE_KEY, JSON.stringify([...trash, ...billsToDelete]));

    toast({ title: "Bill(s) Deleted", description: "The selected bills have been moved to the trash." });
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
    if (!bulkFindValue) {
        toast({ variant: "destructive", title: '"Text to find" is required.' });
        return;
    }
    const newBills = bills.map(bill => {
        if (selectedBills.includes(bill.id!)) {
            const originalValue = bill[bulkEditField];
            if (typeof originalValue === 'string') {
                const updatedValue = originalValue.replace(new RegExp(bulkFindValue, 'gi'), bulkReplaceValue);
                return { ...bill, [bulkEditField]: updatedValue };
            }
        }
        return bill;
    });
    await updateBillsStateAndStorage(newBills);
    toast({ title: 'Bills Updated', description: `${selectedBills.length} bill(s) have been updated.` });
    setSelectedBills([]);
    setIsBulkEditOpen(false);
    setBulkFindValue('');
    setBulkReplaceValue('');
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

  const generateBillPreviewHTML = (billDetails: BillFormValues) => {
    const signatureImage = billDetails.signature ? `<img src="${billDetails.signature}" alt="Evaluator's Signature" style="max-height: 40px; filter: contrast(1.5) brightness(1.1); mix-blend-mode: multiply;" />` : '';

    return `
      <div style="font-family: sans-serif; max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; page-break-after: always;">
        <div class="bill-card-page">
            <div style="display: flex; justify-content: flex-end; font-size: 0.875rem;">
              <div style="display: grid; grid-template-columns: 1fr; gap: 4px; text-align: right;">
                <span>Page No. ....................</span>
                <span>Reg. No. ....................</span>
              </div>
            </div>
            <div style="text-align: center; margin-bottom: 1rem;">
              <h1 style="font-size: 1.5rem; font-weight: bold; text-transform: uppercase;">University of Delhi</h1>
              <h2 style="font-size: 1.25rem; font-weight: bold;">Central Evaluation Centre, SGTB Khalsa College</h2>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem;">
              <span style="font-weight: bold;">Bill,</span>
              <span style="border-bottom: 1px dotted black; min-width: 180px; display: inline-block;"></span>
              <span style="font-weight: bold;">Examination</span>
              <span style="border-bottom: 1px dotted black; min-width: 120px; display: inline-block;"></span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 2rem; font-size: 0.875rem; margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">Evaluator ID:</span><span>${billDetails.evaluatorId}</span></div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">Evaluator Name:</span><span>${billDetails.evaluatorName}</span></div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">Address:</span> <span>${billDetails.address}</span></div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">Course:</span> <span>${billDetails.course}</span></div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">Email ID:</span><span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${billDetails.email}</span></div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">Mobile No:</span><span>${billDetails.mobileNo}</span></div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">College Name:</span> <span>${billDetails.collegeName}</span></div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">Distance (Km) Up-Down:</span> <span>${billDetails.distance}</span></div>
            </div>
            <div style="margin-bottom: 1rem;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 2rem; font-size: 0.875rem;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">Bank Name:</span><span>${billDetails.bankName}</span></div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">Branch:</span><span>${billDetails.branch}</span></div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem 2rem; font-size: 0.875rem; margin-top: 4px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">PAN No.:</span><span>${billDetails.panNo}</span></div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">Account No:</span><span>${billDetails.bankAccountNo}</span></div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold;">IFSC Code:</span><span>${billDetails.ifscCode}</span></div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px;"><span>Paper No.........................................................................................................</span><span style="margin-left: 1rem;">Duration of Paper...................</span></div>
            </div>
            <div style="margin-bottom: 1rem;">
              <h3 style="text-align: center; font-weight: bold;">Part I Examiner /Additional Examiner</h3>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-top: 8px;">
                <thead>
                  <tr>
                    <th style="font-weight: bold; border: 1px solid black; padding: 4px; font-size: 0.75rem; width: 15%;">Total No. of Ans. Scripts Evaluated</th>
                    <th style="font-weight: bold; border: 1px solid black; padding: 4px; font-size: 0.75rem;">Rate Per Ans. Script</th>
                    <th style="font-weight: bold; border: 1px solid black; padding: 4px; font-size: 0.75rem;">Remuneration Claimed</th>
                    <th style="font-weight: bold; border: 1px solid black; padding: 4px; font-size: 0.75rem;">Total No. of Visits</th>
                    <th style="font-weight: bold; border: 1px solid black; padding: 4px; font-size: 0.75rem; width: 40%;">Date of Visits:</th>
                  </tr>
                </thead>
                <tbody><tr style="height: 96px;"><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td></tr></tbody>
              </table>
              <div style="text-align: center; padding-top: 4px;"><span style="font-weight: bold; text-decoration: underline;">Optimum no. of Copies</span></div>
            </div>
            <div style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="width: 66%;"><h3 style="text-align: left; font-weight: bold;">Part II (for use of Head/Additional Head Examiner)</h3><div style="padding-top: 8px;"><span>Payment claimed Rs............................................................</span></div></div>
                <div style="text-align: center;">${signatureImage}<h3 style="font-weight: bold; font-size: 0.875rem; margin-top: 4px;">Signature of Examiner</h3></div>
              </div>
              <hr style="margin: 8px 0; border-top: 1px solid #6b7280;" />
              <div style="text-align: center;"><span style="font-weight: bold; text-decoration: underline;">Official Use</span></div>
              <div style="padding-top: 8px; space-y: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>I) Remuneration for the Scripts Valued :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>II) Payment on account of Additional Examiner (If any) :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>Total of (I+II) :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>Less: 5% TWF :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>Balance :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center;"><span>Conveyance @ Rs. _________ Per day</span><span style="text-align: right;">Rs. ____________________________</span></div>
                  <div style="padding-left: 1rem;"><span>(Up to-30 Km Rs.450/- & above Rs. 600/-)</span></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>Refreshment (125x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>Net Payable :</span><span style="text-align: right;">Rs. ____________________________</span></div>
              </div>
            </div>
            <div style="padding-top: 3rem;">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                <div style="display: flex; flex-direction: column;"><span style="font-weight: bold;">Coordinator</span><div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 0.875rem;">CEC</span><span style="border-bottom: 1px dotted black; width: 100px; height: 32px; display: inline-block;"></span></div></div>
                <span>Dealing Assistant</span>
              </div>
            </div>
        </div>
        <div class="undertaking-page" style="page-break-before: always; padding-top: 3rem;">
             <div style="text-align: center;">
                <h2 style="font-size: 1.5rem; font-weight: bold; text-decoration: underline;">EXAMINATION WING</h2>
                <p style="font-weight: bold; text-decoration: underline;">UNDERTAKING</p>
            </div>
            <div style="margin-top: 2rem; font-size: 1rem; line-height: 1.5;">
                <p>
                    I, jeojfo, hereby undertake that I have not evaluated more than 30 answer scripts of UG Courses in a day. I also undertake that I have not been debarred from any evaluation work by the University of Delhi.
                </p>
                <div style="display: flex; justify-content: flex-end; padding-top: 2rem;">
                    <div style="text-align: left; display: grid; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="margin-right: 8px;">Teacher ID:</span> <span style="border-bottom: 1px solid black; padding: 0 2px; display: inline-block; min-width: 200px;">${billDetails.evaluatorId}</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="margin-right: 8px;">Teacher Name:</span> <span style="border-bottom: 1px solid black; padding: 0 2px; display: inline-block; min-width: 200px;">${billDetails.evaluatorName}</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="margin-right: 8px;">College Name:</span> <span style="border-bottom: 1px solid black; padding: 0 2px; display: inline-block; min-width: 200px;">${billDetails.collegeName}</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="margin-right: 8px;">Mobile No.:</span> <span style="border-bottom: 1px solid black; padding: 0 2px; display: inline-block; min-width: 200px;">${billDetails.mobileNo}</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="margin-right: 8px;">Email ID:</span> <span style="border-bottom: 1px solid black; padding: 0 2px; display: inline-block; min-width: 200px;">${billDetails.email}</span></div>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; padding-top: 4rem;">
                    <div style="text-align: center;">
                        <div style="display: flex; justify-content: center; align-items: center; padding: 4px; min-height: 3rem;">
                           ${signatureImage}
                        </div>
                        <h3 style="font-weight: bold; font-size: 0.875rem; margin-top: 4px;">(Signature of the Teacher)</h3>
                    </div>
                </div>
            </div>
        </div>
      </div>
    `;
  };

  const handleDownloadHTML = () => {
    const billsToDownload = bills.filter(bill => selectedBills.includes(bill.id!));
    if (billsToDownload.length === 0) {
      toast({ variant: "destructive", title: "No bills selected", description: "Please select at least one bill to download." });
      return;
    }

    const allBillsHTML = billsToDownload.map(bill => generateBillPreviewHTML(bill)).join('');
    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bills Preview</title>
           <style>
              body { font-family: 'Inter', sans-serif; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .undertaking-page { page-break-before: always; }
              }
           </style>
        </head>
        <body>
          ${allBillsHTML}
        </body>
      </html>
    `;
    const blob = new Blob([fullHTML], { type: "text/html;charset=utf-8" });
    saveAs(blob, "bills_preview.html");
  };


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Bill Forms And Undertaking</h1>
        <p className="text-lg text-muted-foreground mt-2"></p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Update Bill' : 'New Bill Entry'}</CardTitle>
              <CardDescription></CardDescription>
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
                 <FormField control={form.control} name="signature" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Signature of examiner</FormLabel>
                        <FormControl>
                             <div className="flex items-center gap-4">
                                <Button type="button" onClick={() => document.getElementById('signature-upload')?.click()} variant="outline">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Choose File
                                </Button>
                                <Input id="signature-upload" type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleSignatureUpload} className="hidden" />
                                {signaturePreview && <img src={signaturePreview} alt="Signature Preview" className="h-16 w-32 object-contain border rounded-md p-1 bg-white" />}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
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
                        <CardDescription></CardDescription>
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
                                <Button className="bg-pink-500 hover:bg-pink-600 text-white"><Filter className="mr-2 h-4 w-4"/> Filter</Button>
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
                             <Button variant="outline" onClick={handleDownloadHTML} title="Download Selected as HTML" className="bg-orange-500 hover:bg-orange-600 text-white">
                                <FileDown className="h-4 w-4" />
                            </Button>
                            <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="bg-purple-500 hover:bg-purple-600 text-white"><PencilRuler className="mr-2 h-4 w-4" />Find and Replace</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Find and Replace in Bills</DialogTitle>
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
                                            <Label htmlFor="bulk-find-value" className="text-right">Find</Label>
                                            <Input
                                                id="bulk-find-value"
                                                value={bulkFindValue}
                                                onChange={(e) => setBulkFindValue(e.target.value)}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="bulk-replace-value" className="text-right">Replace</Label>
                                            <Input
                                                id="bulk-replace-value"
                                                value={bulkReplaceValue}
                                                onChange={(e) => setBulkReplaceValue(e.target.value)}
                                                className="col-span-3"
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
                                    This action will move {selectedBills.length} bill(s) to the trash.
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
                                <Button className="bg-green-500 hover:bg-green-600 text-white"><Share2 className="mr-2 h-4 w-4" /> Share Form</Button>
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
                            <TableRow className="bg-primary hover:bg-primary/90">
                                <TableHead className="w-12 text-primary-foreground">
                                     <Checkbox
                                      onCheckedChange={handleSelectAll}
                                      checked={filteredBills.length > 0 && selectedBills.length === filteredBills.length}
                                      aria-label="Select all"
                                      className="border-primary-foreground text-primary-foreground"
                                    />
                                </TableHead>
                                <TableHead className="text-primary-foreground">S. No.</TableHead>
                                <TableHead className="text-primary-foreground">Evaluator ID</TableHead>
                                <TableHead className="text-primary-foreground">Evaluator Name</TableHead>
                                <TableHead className="text-primary-foreground">Mobile No.</TableHead>
                                <TableHead className="text-primary-foreground">Bank Account No.</TableHead>
                                <TableHead className="text-primary-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBills.map((bill, index) => (
                                <TableRow key={bill.id} className={cn(index % 2 === 0 ? "bg-muted/50" : "bg-background")} data-state={selectedBills.includes(bill.id!) ? "selected" : "unselected"}>
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
                                            <Button variant="outline" size="icon" onClick={() => handleView(bill.evaluatorId)} style={{backgroundColor: 'yellow', color: 'black'}}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                             <Button variant="outline" size="icon" onClick={() => handleEdit(bill)} style={{backgroundColor: 'green', color: 'white'}}>
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
                                                        This action will move this bill to the trash.
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
            <CardFooter>
                <Button onClick={() => router.push('/teachers')}><Users className="mr-2 h-4 w-4" /> Teachers Data</Button>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
