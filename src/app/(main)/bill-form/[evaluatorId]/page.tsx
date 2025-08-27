
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BillFormValues } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Settings, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import { getBillsStorageKey, getGlobalBillSettingsKey, getBillCustomizationKey } from "@/lib/constants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";


type GlobalBillSettings = {
    billName: string;
    examinationName: string;
    coordinatorName: string;
    twfText: string;
    conveyanceUnder30: number;
    conveyanceOver30: number;
}

type BillCustomization = {
    universityName: string;
    centerName: string;
    billLabel: string;
    examLabel: string;
    pageNoLabel: string;
    regNoLabel: string;
    evaluatorIdLabel: string;
    evaluatorNameLabel: string;
    addressLabel: string;
    courseLabel: string;
    emailLabel: string;
    mobileLabel: string;
    collegeLabel: string;
    distanceLabel: string;
    bankNameLabel: string;
    branchLabel: string;
    panNoLabel: string;
    accountNoLabel: string;
    ifscLabel: string;
    paperNoLabel: string;
    durationLabel: string;
    part1Header: string;
    totalScriptsLabel: string;
    ratePerScriptLabel: string;
    remunerationLabel: string;
    totalVisitsLabel: string;
    dateOfVisitsLabel: string;
    optimumCopiesLabel: string;
    part2Header: string;
    paymentClaimedLabel: string;
    signatureLabel: string;
    officialUseLabel: string;
    remunerationValuedLabel: string;
    additionalExaminerPaymentLabel: string;
    totalPart1And2Label: string;
    balanceLabel: string;
    conveyanceLabel: string;
    refreshmentLabel: string;
    netPayableLabel: string;
    coordinatorLabel: string;
    dealingAssistantLabel: string;
    undertakingHeader: string;
    undertakingSubheader: string;
    undertakingText: string;
    undertakingTeacherIdLabel: string;
    undertakingTeacherNameLabel: string;
    undertakingCollegeLabel: string;
    undertakingMobileLabel: string;
    undertakingEmailLabel: string;
    undertakingSignatureLabel: string;
    conveyanceSubtextBefore: string;
    conveyanceSubtextAfter: string;
};

const defaultCustomization: BillCustomization = {
    universityName: "University of Delhi",
    centerName: "Central Evaluation Centre, SGTB Khalsa College",
    billLabel: "Bill,",
    examLabel: "Examination",
    pageNoLabel: "Page No. ....................",
    regNoLabel: "Reg. No. ....................",
    evaluatorIdLabel: "Evaluator ID:",
    evaluatorNameLabel: "Evaluator Name:",
    addressLabel: "Address:",
    courseLabel: "Course:",
    emailLabel: "Email ID:",
    mobileLabel: "Mobile No:",
    collegeLabel: "College Name:",
    distanceLabel: "Distance (Km) Up-Down:",
    bankNameLabel: "Bank Name:",
    branchLabel: "Branch:",
    panNoLabel: "PAN No.:",
    accountNoLabel: "Account No:",
    ifscLabel: "IFSC Code:",
    paperNoLabel: "Paper No.........................................................................................................",
    durationLabel: "Duration of Paper...................",
    part1Header: "Part I Examiner /Additional Examiner",
    totalScriptsLabel: "Total No. of Ans. Scripts Evaluated",
    ratePerScriptLabel: "Rate Per Ans. Script",
    remunerationLabel: "Remuneration Claimed",
    totalVisitsLabel: "Total No. of Visits",
    dateOfVisitsLabel: "Date of Visits:",
    optimumCopiesLabel: "Optimum no. of Copies",
    part2Header: "Part II (for use of Head/Additional Head Examiner)",
    paymentClaimedLabel: "Payment claimed Rs............................................................",
    signatureLabel: "Signature of Examiner",
    officialUseLabel: "Official Use",
    remunerationValuedLabel: "I) Remuneration for the Scripts Valued :",
    additionalExaminerPaymentLabel: "II) Payment on account of Additional Examiner (If any) :",
    totalPart1And2Label: "Total of (I+II) :",
    balanceLabel: "Balance :",
    conveyanceLabel: "Conveyance @ Rs. _________ Per day",
    refreshmentLabel: "Refreshment (125x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) :",
    netPayableLabel: "Net Payable :",
    coordinatorLabel: "Coordinator",
    dealingAssistantLabel: "Dealing Assistant",
    undertakingHeader: "EXAMINATION WING",
    undertakingSubheader: "UNDERTAKING",
    undertakingText: "I certify that none of my relations (husband, wife, son, daughter, brother, sister, nephew, niece, sister-in-law or daughter-in-law etc.) is a candidate at the Central Evaluation Center where evaluation is being done.",
    undertakingTeacherIdLabel: "Teacher ID:",
    undertakingTeacherNameLabel: "Teacher Name:",
    undertakingCollegeLabel: "College Name:",
    undertakingMobileLabel: "Mobile No.:",
    undertakingEmailLabel: "Email ID:",
    undertakingSignatureLabel: "(Signature of the Teacher)",
    conveyanceSubtextBefore: '(Up to 30 Km Rs.',
    conveyanceSubtextAfter: '/- & above Rs.',
};


export default function BillViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [billDetails, setBillDetails] = useState<BillFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const [globalSettings, setGlobalSettings] = useState<GlobalBillSettings>({
      billName: '',
      examinationName: '',
      coordinatorName: '',
      twfText: '5% TWF',
      conveyanceUnder30: 450,
      conveyanceOver30: 600,
  });

  const [customization, setCustomization] = useState<BillCustomization>(defaultCustomization);
  

  useEffect(() => {
    const evaluatorId = params.evaluatorId;
    if (evaluatorId) {
        try {
            // Load global settings
            const storedSettings = localStorage.getItem(getGlobalBillSettingsKey());
            if (storedSettings) {
                const parsedSettings = JSON.parse(storedSettings);
                setGlobalSettings(prev => ({ ...prev, ...parsedSettings}));
            }

            // Load customizations
            const storedCustomization = localStorage.getItem(getBillCustomizationKey());
            if (storedCustomization) {
                const parsedCustomization = JSON.parse(storedCustomization);
                setCustomization(prev => ({ ...prev, ...parsedCustomization }));
            }

            const storedBills = localStorage.getItem(getBillsStorageKey());
            if (storedBills) {
                const allBills: BillFormValues[] = JSON.parse(storedBills);
                const decodedEvaluatorId = decodeURIComponent(evaluatorId as string);
                const foundBill = allBills.find(b => b.evaluatorId === decodedEvaluatorId);

                if (foundBill) {
                    setBillDetails(foundBill);
                } else {
                    toast({ variant: "destructive", title: "Not Found", description: "No bill details found for this evaluator ID." });
                    router.push("/bill-form");
                }
            } else {
                 toast({ variant: "destructive", title: "No Data", description: "No bill data found. Please submit a bill first." });
                 router.push("/bill-form");
            }
        } catch (error) {
            console.error("Error parsing localStorage data:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load bill details." });
            router.push("/bill-form");
        } finally {
            setIsLoading(false);
        }
    }
  }, [params.evaluatorId, router, toast]);
  
   const handlePrint = (option: 'bill' | 'undertaking') => {
    const printSection = document.getElementById('print-section');
    if (!printSection) return;

    printSection.classList.remove('print-bill-only', 'print-undertaking-only');

    if (option === 'bill') {
        printSection.classList.add('print-bill-only');
    } else if (option === 'undertaking') {
        printSection.classList.add('print-undertaking-only');
    }
    
    window.print();
  };


  const handleSaveSettings = () => {
    localStorage.setItem(getGlobalBillSettingsKey(), JSON.stringify(globalSettings));
    toast({ title: "Settings Saved", description: "The global bill fields have been updated." });
    setIsSettingsOpen(false);
  };
  
  const handleSaveCustomization = () => {
    localStorage.setItem(getBillCustomizationKey(), JSON.stringify(customization));
    toast({ title: "Customization Saved", description: "The bill layout has been updated." });
    setIsCustomizeOpen(false);
  };
  
  const handleCustomizationChange = (field: keyof BillCustomization, value: string) => {
    setCustomization(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading bill details...</div>;
  }

  if (!billDetails) {
    return <div className="flex justify-center items-center h-full">No bill details found. Redirecting...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
        <style>{`
            @page {
                size: A4;
                margin: 0;
            }
            @media print {
                body, .main-layout {
                    background: white !important;
                    color: black !important;
                }
                body * {
                    visibility: hidden;
                }
                 #print-section, #print-section .bill-card-page, #print-section .undertaking-page, #print-section * {
                    visibility: visible;
                    color: black !important;
                }
                 #print-section h1, #print-section h2, #print-section h3, #print-section span, #print-section div, #print-section p, #print-section th, #print-section td {
                    color: black !important;
                 }
                #print-section {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    margin: 0;
                    padding: 1.5cm;
                    box-sizing: border-box;
                    background: white !important;
                }
                 #print-section .print-header-title {
                    font-size: 1.25rem;
                }
                 #print-section .print-header-subtitle {
                    font-size: 1.1rem;
                }
                .no-print {
                    display: none;
                }
                .manual-input {
                    border: none;
                    border-bottom: 1px dotted black;
                    border-radius: 0;
                    padding-left: 2px;
                    padding-right: 2px;
                    background: transparent;
                }
                .manual-input:focus {
                    outline: none;
                    box-shadow: none;
                }
                .fill-in-blank {
                    border-bottom: 1px dotted black;
                    padding: 0 4px;
                    display: inline-block;
                    min-width: 100px;
                }
                 .print-table, .print-table th, .print-table td {
                    border: 1px solid black !important;
                    border-collapse: collapse;
                }
                 .signature-image {
                    filter: none !important;
                    mix-blend-mode: initial !important;
                 }
                
                .undertaking-page {
                    display: block;
                    visibility: visible;
                    page-break-before: always;
                }
                .underlined-value {
                    border-bottom: 1px solid black;
                    padding: 0 2px;
                    word-break: break-word;
                 }
                .undertaking-details .underlined-value {
                    display: inline-block;
                    min-width: 200px;
                }

                .print-bill-only .undertaking-page { 
                    visibility: hidden !important; 
                    display: none !important; 
                    page-break-before: auto !important;
                }

                .print-undertaking-only .bill-card-page { 
                    visibility: hidden !important;
                    display: none !important;
                }
                .print-undertaking-only .undertaking-page {
                    page-break-before: auto !important;
                }
            }
             .manual-input {
                border: none;
                border-radius: 0;
                padding-left: 2px;
                padding-right: 2px;
                background: transparent;
            }
            .manual-input:focus {
                outline: none;
                box-shadow: none;
            }
            .total-scripts-cell {
                width: 15%;
            }
            .date-of-visits-cell {
                width: 40%;
            }
             .signature-image {
                filter: contrast(1.5) brightness(1.1);
             }
             .underlined-value {
                padding: 0 2px;
                word-break: break-word;
             }
        `}</style>

      <header className="flex items-center justify-between gap-4 no-print mb-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/bill-form')}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-4xl font-bold tracking-tight font-headline">Bill Details</h1>
                <p className="text-lg text-muted-foreground mt-2">Viewing details for {billDetails.evaluatorName}.</p>
            </div>
        </div>
         <div className="flex items-center gap-2">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                    <Button size="icon" className="bg-orange-500 hover:bg-orange-600 text-white"><Settings className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Global Bill Fields</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="billName" className="text-right">Bill Name</Label>
                            <Input
                                id="billName"
                                value={globalSettings.billName}
                                onChange={(e) => setGlobalSettings(s => ({ ...s, billName: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="examinationName" className="text-right">Examination</Label>
                            <Input
                                id="examinationName"
                                value={globalSettings.examinationName}
                                onChange={(e) => setGlobalSettings(s => ({ ...s, examinationName: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="coordinatorName" className="text-right">Coordinator</Label>
                            <Input
                                id="coordinatorName"
                                value={globalSettings.coordinatorName}
                                onChange={(e) => setGlobalSettings(s => ({ ...s, coordinatorName: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="twfText" className="text-right">TWF Text</Label>
                            <Input
                                id="twfText"
                                value={globalSettings.twfText}
                                onChange={(e) => setGlobalSettings(s => ({ ...s, twfText: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="conveyanceUnder30" className="text-right">Rate (≤30km)</Label>
                            <Input
                                id="conveyanceUnder30"
                                type="number"
                                value={globalSettings.conveyanceUnder30}
                                onChange={(e) => setGlobalSettings(s => ({ ...s, conveyanceUnder30: Number(e.target.value) }))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="conveyanceOver30" className="text-right">Rate (>30km)</Label>
                            <Input
                                id="conveyanceOver30"
                                type="number"
                                value={globalSettings.conveyanceOver30}
                                onChange={(e) => setGlobalSettings(s => ({ ...s, conveyanceOver30: Number(e.target.value) }))}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                        <Button type="button" onClick={handleSaveSettings}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
             <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="bg-teal-500 hover:bg-teal-600 text-white"><Wand2 className="mr-2 h-4 w-4" /> Customize</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Customize Bill Layout</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh]">
                        <div className="grid grid-cols-2 gap-4 p-4">
                            {Object.keys(defaultCustomization).map((key) => (
                                <div key={key} className="space-y-1">
                                    <Label htmlFor={`custom-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                    <Input
                                        id={`custom-${key}`}
                                        value={customization[key as keyof BillCustomization]}
                                        onChange={(e) => handleCustomizationChange(key as keyof BillCustomization, e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCustomizeOpen(false)}>Cancel</Button>
                        <Button type="button" onClick={handleSaveCustomization}>Save Customization</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="bg-violet-500 hover:bg-violet-600 text-white"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handlePrint('bill')}>
                        Print Bill Form
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrint('undertaking')}>
                        Print Undertaking
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      
      <div id="print-section">
        <div className="bill-card-page">
            <Card className="shadow-none border-none">
                <CardHeader className="p-4 md:p-6 print:p-0">
                    <div className="flex justify-end text-sm">
                        <div className="grid grid-cols-1 gap-1 text-right">
                            <span>{customization.pageNoLabel}</span>
                            <span>{customization.regNoLabel}</span>
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <h1 className="text-xl md:text-2xl font-bold uppercase print-header-title">{customization.universityName}</h1>
                        <h2 className="text-lg md:text-xl font-bold print-header-subtitle">{customization.centerName}</h2>
                        <div className="flex items-baseline justify-center gap-4">
                            <div className="flex items-baseline">
                                <span className="font-bold">{customization.billLabel}</span>
                                <span className="ml-2 font-bold">{globalSettings.billName}</span>
                            </div>
                            <div className="flex items-baseline">
                                <span className="font-bold">{customization.examLabel}</span>
                                <span className="ml-2 font-bold">{globalSettings.examinationName}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 text-base p-4 md:p-6 print:p-0 print:text-sm">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">{customization.evaluatorIdLabel}</span>
                            <span className="text-right">{billDetails.evaluatorId}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">{customization.evaluatorNameLabel}</span>
                            <span className="text-right">{billDetails.evaluatorName}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">{customization.addressLabel}</span> <span className="text-right">{billDetails.address}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">{customization.courseLabel}</span> <span className="text-right">{billDetails.course}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">{customization.emailLabel}</span>
                            <span className="truncate text-right">{billDetails.email}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">{customization.mobileLabel}</span>
                            <span className="text-right">{billDetails.mobileNo}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">{customization.collegeLabel}</span> <span className="text-right">{billDetails.collegeName}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">{customization.distanceLabel}</span> <span className="text-right">{billDetails.distance}</span>
                        </div>
                    </div>


                    <div className="pt-2">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                            <div className="flex justify-between items-baseline border-b pb-1">
                                <span className="font-bold shrink-0">{customization.bankNameLabel}</span>
                                <span className="text-right">{billDetails.bankName}</span>
                            </div>
                            <div className="flex justify-between items-baseline border-b pb-1">
                                <span className="font-bold shrink-0">{customization.branchLabel}</span>
                                <span className="text-right">{billDetails.branch}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-x-8 gap-y-1 mt-1">
                            <div className="flex justify-between items-baseline border-b pb-1">
                                <span className="font-bold shrink-0">{customization.panNoLabel}</span>
                                <span className="text-right">{billDetails.panNo}</span>
                            </div>
                            <div className="flex justify-between items-baseline border-b pb-1">
                                <span className="font-bold shrink-0">{customization.accountNoLabel}</span>
                                <span className="font-mono text-right">{billDetails.bankAccountNo}</span>
                            </div>
                            <div className="flex justify-between items-baseline border-b pb-1">
                                <span className="font-bold shrink-0">{customization.ifscLabel}</span>
                                <span className="font-mono text-right">{billDetails.ifscCode}</span>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <span>{customization.paperNoLabel}</span>
                            <span className="ml-4">{customization.durationLabel}</span>
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <h3 className="text-center font-bold">{customization.part1Header}</h3>
                        <Table className="mt-1 border print-table w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold border print-table total-scripts-cell text-xs">{customization.totalScriptsLabel}</TableHead>
                                    <TableHead className="font-bold border print-table text-xs">{customization.ratePerScriptLabel}</TableHead>
                                    <TableHead className="font-bold border print-table text-xs">{customization.remunerationLabel}</TableHead>
                                    <TableHead className="font-bold border print-table text-xs">{customization.totalVisitsLabel}</TableHead>
                                    <TableHead className="font-bold border print-table date-of-visits-cell text-xs">{customization.dateOfVisitsLabel}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="h-24">
                                    <TableCell className="border print-table total-scripts-cell"></TableCell>
                                    <TableCell className="border print-table"></TableCell>
                                    <TableCell className="border print-table"></TableCell>
                                    <TableCell className="border print-table"></TableCell>
                                    <TableCell className="border print-table date-of-visits-cell"></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        <div className="text-center pt-1">
                            <span className="font-bold underline">{customization.optimumCopiesLabel}</span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between items-end">
                            <div className="w-2/3 space-y-1">
                                <h3 className="text-left font-bold">{customization.part2Header}</h3>
                                <div className="pt-1">
                                    <span>{customization.paymentClaimedLabel}</span>
                                </div>
                            </div>
                            {billDetails.signature && (
                                <div className="text-center">
                                    <div className="flex justify-center items-center rounded-md p-1 min-h-[3rem]">
                                        <img src={billDetails.signature} alt="Evaluator's Signature" className="max-h-12 signature-image" />
                                    </div>
                                    <h3 className="font-bold text-sm mt-1">{customization.signatureLabel}</h3>
                                </div>
                            )}
                        </div>
                        <hr className="my-2 border-t border-foreground" />
                        <div className="text-center">
                            <span className="font-bold underline">{customization.officialUseLabel}</span>
                        </div>
                        <div className="pt-2 space-y-1">
                            <div className="flex justify-between items-center">
                                <span>{customization.remunerationValuedLabel}</span>
                                <span className="text-right">Rs. ____________________________</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>{customization.additionalExaminerPaymentLabel}</span>
                                <span className="text-right">Rs. ____________________________</span>
                            </div>
                            <div className="flex justify-between items-center">
                            <span>{customization.totalPart1And2Label}</span>
                            <span className="text-right">Rs. ____________________________</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>{globalSettings.twfText} :</span>
                                <span className="text-right">Rs. ____________________________</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>{customization.balanceLabel}</span>
                                <span className="text-right">Rs. ____________________________</span>
                            </div>
                            <div>
                            <div className="flex justify-between items-center">
                                    <span>{customization.conveyanceLabel}</span>
                                    <span className="text-right">Rs. ____________________________</span>
                                </div>
                                <div className="pl-4">
                                    <span>{customization.conveyanceSubtextBefore} {globalSettings.conveyanceUnder30}{customization.conveyanceSubtextAfter} {globalSettings.conveyanceOver30}/-)</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span dangerouslySetInnerHTML={{ __html: customization.refreshmentLabel }}></span>
                                <span className="text-right">Rs. ____________________________</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>{customization.netPayableLabel}</span>
                                <span className="text-right">Rs. ____________________________</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12">
                        <div className="flex items-start justify-between">
                             <div className="flex flex-col">
                                <span className="font-bold">{customization.coordinatorLabel}</span>
                                <div className="text-sm">
                                    <span>CEC: {globalSettings.coordinatorName}</span>
                                </div>
                            </div>
                            <span>{customization.dealingAssistantLabel}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="undertaking-page pt-12">
            <div className="text-center">
                <h2 className="text-2xl font-bold underline">{customization.undertakingHeader}</h2>
                <h3 className="text-xl font-bold underline">{customization.undertakingSubheader}</h3>
            </div>
            <div className="mt-8 space-y-4 text-base">
                <p>
                    {customization.undertakingText}
                </p>
                <div className="flex justify-end pt-8">
                    <div className="text-left space-y-1 undertaking-details">
                        <div className="flex justify-between items-baseline"><span className="mr-2">{customization.undertakingTeacherIdLabel}</span> <span className="underlined-value">{billDetails.evaluatorId}</span></div>
                        <div className="flex justify-between items-baseline"><span className="mr-2">{customization.undertakingTeacherNameLabel}</span> <span className="underlined-value">{billDetails.evaluatorName}</span></div>
                        <div className="flex justify-between items-baseline"><span className="mr-2">{customization.undertakingCollegeLabel}</span> <span className="underlined-value">{billDetails.collegeName}</span></div>
                        <div className="flex justify-between items-baseline"><span className="mr-2">{customization.undertakingMobileLabel}</span> <span className="underlined-value">{billDetails.mobileNo}</span></div>
                        <div className="flex justify-between items-baseline"><span className="mr-2">{customization.undertakingEmailLabel}</span> <span className="underlined-value">{billDetails.email}</span></div>
                    </div>
                </div>

                <div className="flex justify-end pt-16">
                     {billDetails.signature && (
                        <div className="text-center">
                            <div className="flex justify-center items-center p-1 min-h-[3rem]">
                                <img src={billDetails.signature} alt="Evaluator's Signature" className="max-h-12 signature-image" />
                            </div>
                            <h3 className="font-bold text-sm mt-1">{customization.undertakingSignatureLabel}</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>

    </div>
  );

}


    