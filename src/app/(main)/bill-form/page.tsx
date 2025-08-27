
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import QRCode from "qrcode.react";
import { saveAs } from "file-saver";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Trash2, Upload, Edit, Search, FileDown, Filter, Share2, Copy, PencilRuler, Users, Printer, ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { getBillsStorageKey, getBillsFileName, getBillTrashStorageKey, getGlobalBillSettingsKey } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


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

type GlobalBillSettings = {
    billName: string;
    examinationName: string;
    coordinatorName: string;
    conveyanceUnder30: number;
    conveyanceOver30: number;
}

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
type SortDirection = "asc" | "desc";

function BillFormPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [globalSettings, setGlobalSettings] = useState<GlobalBillSettings>({
      billName: '',
      examinationName: '',
      coordinatorName: '',
      conveyanceUnder30: 450,
      conveyanceOver30: 600,
  });


  const { isConnected, files, readFile, writeFile } = useGoogleDrive();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicFormUrl(`${window.location.origin}/entry`);
      const searchFromParams = searchParams.get('search');
      if (searchFromParams) {
        setSearchTerm(searchFromParams);
      }
      const storedSettings = localStorage.getItem(getGlobalBillSettingsKey());
      if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          setGlobalSettings(prev => ({ ...prev, ...parsedSettings}));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      let loadedBills: BillFormValues[] = [];
      if (typeof window === 'undefined') return;
      
      const billsStorageKey = getBillsStorageKey();
      const billsFileName = getBillsFileName();

      if (isConnected) {
        try {
          const fileContent = await readFile(billsFileName);
          if (fileContent) {
            const driveBills = JSON.parse(fileContent);
            loadedBills = driveBills;
            localStorage.setItem(billsStorageKey, JSON.stringify(driveBills));
          } else {
            const localBills = localStorage.getItem(billsStorageKey);
            if (localBills) loadedBills = JSON.parse(localBills);
          }
        } catch (e) {
            console.error("Failed to load from Drive, using local fallback", e);
            const localBills = localStorage.getItem(billsStorageKey);
            if (localBills) loadedBills = JSON.parse(localBills);
        }
      } else {
         const localBills = localStorage.getItem(billsStorageKey);
         if (localBills) loadedBills = JSON.parse(localBills);
      }
      setBills(loadedBills);
    };
    loadData();
  }, [isConnected, readFile]);

  const filteredBills = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    
    let sortedBills = [...bills].sort((a, b) => {
        const nameA = a.evaluatorName.toLowerCase();
        const nameB = b.evaluatorName.toLowerCase();
        if (sortDirection === 'asc') {
            return nameA.localeCompare(nameB);
        } else {
            return nameB.localeCompare(nameA);
        }
    });

    return sortedBills.filter(bill => {
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
  }, [bills, searchTerm, filters, sortDirection]);


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
        localStorage.setItem(getBillsStorageKey(), JSON.stringify(newBills));
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
            await writeFile(getBillsFileName(), JSON.stringify(newBills, null, 2));
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

    const storedTrash = localStorage.getItem(getBillTrashStorageKey());
    const trash = storedTrash ? JSON.parse(storedTrash) : [];
    localStorage.setItem(getBillTrashStorageKey(), JSON.stringify([...trash, ...billsToDelete]));

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
        return {
            "Evaluator ID": rest.evaluatorId,
            "Evaluator Name": rest.evaluatorName,
            "College Name": rest.collegeName,
            "Course": rest.course,
            "Email": rest.email,
            "PAN No.": rest.panNo,
            "Address": rest.address,
            "Distance": rest.distance,
            "Mobile No.": rest.mobileNo,
            "Bank Name": rest.bankName,
            "Branch": rest.branch,
            "Bank Account No.": rest.bankAccountNo,
            "IFSC Code": rest.ifscCode,
        };
    });
    
    if (dataToExport.length === 0) {
        toast({ variant: 'destructive', title: 'No data to export' });
        return;
    }
    
    // Create a new worksheet with bold headers
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    const headers = Object.keys(dataToExport[0]);
    
    const headerRow = headers.map(header => ({
        v: header,
        t: 's',
        s: { font: { bold: true } }
    }));
    
    XLSX.utils.sheet_add_aoa(worksheet, [headerRow], { origin: 'A1' });
    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A2', skipHeader: true });

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
    const signatureImage = billDetails.signature ? `<img src="${billDetails.signature}" alt="Evaluator's Signature" class="signature-image" style="max-height: 48px;" />` : '';

    return `
      <div class="bill-page-container">
        <div class="bill-card-page">
            <div style="display: flex; justify-content: flex-end; font-size: 0.875rem;">
              <div style="display: grid; grid-template-columns: 1fr; gap: 4px; text-align: right;">
                <span>Page No. ....................</span>
                <span>Reg. No. ....................</span>
              </div>
            </div>
            <div style="text-align: center; margin-top: 1rem;">
              <h1 class="print-header-title" style="font-size: 1.25rem; font-weight: bold; text-transform: uppercase;">University of Delhi</h1>
              <h2 class="print-header-subtitle" style="font-size: 1.1rem; font-weight: bold;">Central Evaluation Centre, SGTB Khalsa College</h2>
              <div style="display: flex; align-items: baseline; justify-content: center; gap: 1rem;">
                <div style="display: flex; align-items: baseline;">
                    <span style="font-weight: bold;">Bill,</span>
                    <span style="margin-left: 0.5rem; font-weight: bold;">${globalSettings.billName}</span>
                </div>
                <div style="display: flex; align-items: baseline;">
                    <span style="font-weight: bold;">Examination</span>
                    <span style="margin-left: 0.5rem; font-weight: bold;">${globalSettings.examinationName}</span>
                </div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem 2rem; font-size: 1rem; margin-top: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">Evaluator ID:</span><span style="text-align: right;">${billDetails.evaluatorId}</span></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">Evaluator Name:</span><span style="text-align: right;">${billDetails.evaluatorName}</span></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">Address:</span> <span style="text-align: right;">${billDetails.address}</span></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">Course:</span> <span style="text-align: right;">${billDetails.course}</span></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">Email ID:</span><span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right;">${billDetails.email}</span></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">Mobile No:</span><span style="text-align: right;">${billDetails.mobileNo}</span></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">College Name:</span> <span style="text-align: right;">${billDetails.collegeName}</span></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">Distance (Km) Up-Down:</span> <span style="text-align: right;">${billDetails.distance}</span></div>
            </div>
            <div style="margin-top: 0.5rem;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">Bank Name:</span><span style="text-align: right;">${billDetails.bankName}</span></div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">Branch:</span><span style="text-align: right;">${billDetails.branch}</span></div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem 2rem; margin-top: 0.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">PAN No.:</span><span style="text-align: right;">${billDetails.panNo}</span></div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">Account No:</span><span style="font-family: monospace; text-align: right;">${billDetails.bankAccountNo}</span></div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: bold; flex-shrink: 0;">IFSC Code:</span><span style="font-family: monospace; text-align: right;">${billDetails.ifscCode}</span></div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;"><span>Paper No.........................................................................................................</span><span style="margin-left: 1rem;">Duration of Paper...................</span></div>
            </div>
            <div style="margin-top: 0.5rem;">
              <h3 style="text-align: center; font-weight: bold;">Part I Examiner /Additional Examiner</h3>
              <table class="print-table" style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-top: 0.25rem;">
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
              <div style="text-align: center; padding-top: 0.25rem;"><span style="font-weight: bold; text-decoration: underline;">Optimum no. of Copies</span></div>
            </div>
            <div style="margin-top: 0.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="width: 66%;"><h3 style="text-align: left; font-weight: bold;">Part II (for use of Head/Additional Head Examiner)</h3><div style="padding-top: 0.25rem;"><span>Payment claimed Rs............................................................</span></div></div>
                <div style="text-align: center;"><div style="display: flex; justify-content: center; align-items: center; padding: 4px; min-height: 3rem;">${signatureImage}</div><h3 style="font-weight: bold; font-size: 0.875rem; margin-top: 0.25rem;">Signature of Examiner</h3></div>
              </div>
              <hr style="margin: 0.5rem 0; border-top: 1px solid black;" />
              <div style="text-align: center;"><span style="font-weight: bold; text-decoration: underline;">Official Use</span></div>
              <div style="padding-top: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>I) Remuneration for the Scripts Valued :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>II) Payment on account of Additional Examiner (If any) :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>Total of (I+II) :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>Less: 5% TWF :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>Balance :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center;"><span>Conveyance @ Rs. _________ Per day</span><span style="text-align: right;">Rs. ____________________________</span></div>
                  <div style="padding-left: 1rem;"><span>(Up to 30 Km Rs. ${globalSettings.conveyanceUnder30}/- & above Rs. ${globalSettings.conveyanceOver30}/-)</span></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>Refreshment (125x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) :</span><span style="text-align: right;">Rs. ____________________________</span></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span>Net Payable :</span><span style="text-align: right;">Rs. ____________________________</span></div>
              </div>
            </div>
            <div style="padding-top: 3rem;">
              <div style="display: flex; align-items: flex-start; justify-content: space-between;">
                <div style="display: flex; flex-direction: column;"><span style="font-weight: bold;">Coordinator</span><div style="font-size: 0.875rem;"><span>CEC: ${globalSettings.coordinatorName}</span></div></div>
                <span>Dealing Assistant</span>
              </div>
            </div>
        </div>
        <div class="undertaking-page" style="padding-top: 3rem;">
             <div style="text-align: center;">
                <h2 style="font-size: 1.5rem; font-weight: bold; text-decoration: underline;">EXAMINATION WING</h2>
                <h3 style="font-size: 1.25rem; font-weight: bold; text-decoration: underline;">UNDERTAKING</h3>
            </div>
            <div style="margin-top: 2rem; font-size: 1rem; line-height: 1.5;">
                <p>
                    I certify that none of my relations (husband, wife, son, daughter, brother, sister, nephew, niece, sister-in-law or daughter-in-law etc.) is a candidate at the Central Evaluation Center where evaluation is being done.
                </p>
                <div style="display: flex; justify-content: flex-end; padding-top: 2rem;">
                    <div style="text-align: left; display: grid; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="margin-right: 8px;">Teacher ID:</span> <span class="underlined-value" style="border-bottom: 1px solid black; padding: 0 2px; display: inline-block; min-width: 200px;">${billDetails.evaluatorId}</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="margin-right: 8px;">Teacher Name:</span> <span class="underlined-value" style="border-bottom: 1px solid black; padding: 0 2px; display: inline-block; min-width: 200px;">${billDetails.evaluatorName}</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="margin-right: 8px;">College Name:</span> <span class="underlined-value" style="border-bottom: 1px solid black; padding: 0 2px; display: inline-block; min-width: 200px;">${billDetails.collegeName}</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="margin-right: 8px;">Mobile No.:</span> <span class="underlined-value" style="border-bottom: 1px solid black; padding: 0 2px; display: inline-block; min-width: 200px;">${billDetails.mobileNo}</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="margin-right: 8px;">Email ID:</span> <span class="underlined-value" style="border-bottom: 1px solid black; padding: 0 2px; display: inline-block; min-width: 200px;">${billDetails.email}</span></div>
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
                .bill-page-container { page-break-after: always; }
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

  const handlePrintAll = (option: 'bill' | 'undertaking') => {
    const billsToPrint = bills.filter(bill => selectedBills.includes(bill.id!));
    if (billsToPrint.length === 0) {
        toast({ variant: "destructive", title: "No bills selected", description: "Please select at least one bill to print." });
        return;
    }

    const allBillsHTML = billsToPrint.map(bill => generateBillPreviewHTML(bill)).join('');
    const printWindowClass = option === 'bill' ? 'print-bill-only' : 'print-undertaking-only';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print All</title>
                <style>
                    body {
                        margin: 0;
                        font-family: sans-serif;
                    }
                    @page {
                        size: A4;
                        margin: 1.5cm;
                    }
                    .bill-page-container {
                        page-break-after: always;
                    }
                    .print-table, .print-table th, .print-table td {
                        border: 1px solid black !important;
                        border-collapse: collapse;
                    }
                    .signature-image {
                        filter: none !important;
                        mix-blend-mode: initial !important;
                    }
                    .print-bill-only .undertaking-page { display: none !important; }
                    .print-undertaking-only .bill-card-page { display: none !important; }
                </style>
            </head>
            <body class="${printWindowClass}">
                ${allBillsHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
  };


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Bill Forms And Undertaking</h1>
        
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Update Bill' : 'New Bill Entry'}</CardTitle>
              
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
                        <Button
                            variant="outline"
                            onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                        >
                            {sortDirection === 'asc' ? <ArrowUpAZ className="mr-2 h-4 w-4"/> : <ArrowDownAZ className="mr-2 h-4 w-4" />}
                            Sort
                        </Button>
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
                            <TableRow className="bg-nav-bill hover:bg-nav-bill/90">
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
            <CardFooter className="justify-between">
                <Button onClick={() => router.push('/teachers')}><Users className="mr-2 h-4 w-4" /> Teachers Data</Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button className="bg-violet-500 hover:bg-violet-600 text-white" disabled={selectedBills.length === 0}>
                            <Printer className="mr-2 h-4 w-4" />
                             Print Selected ({selectedBills.length})
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handlePrintAll('bill')}>
                            Print Bill Forms
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrintAll('undertaking')}>
                            Print Undertakings
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default function BillFormPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <BillFormPageComponent />
        </React.Suspense>
    )
}

    