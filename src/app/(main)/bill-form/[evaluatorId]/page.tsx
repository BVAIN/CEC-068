
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BillFormValues } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import { BILLS_STORAGE_KEY, GLOBAL_BILL_SETTINGS_KEY } from "@/lib/constants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


type GlobalBillSettings = {
    billName: string;
    examinationName: string;
    coordinatorName: string;
}

export default function BillViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [billDetails, setBillDetails] = useState<BillFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalBillSettings>({
      billName: '',
      examinationName: '',
      coordinatorName: ''
  });
  

  useEffect(() => {
    const evaluatorId = params.evaluatorId;
    try {
        // Load global settings
        const storedSettings = localStorage.getItem(GLOBAL_BILL_SETTINGS_KEY);
        if (storedSettings) {
            setGlobalSettings(JSON.parse(storedSettings));
        }

        const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
        if (storedBills && evaluatorId) {
            const allBills: BillFormValues[] = JSON.parse(storedBills);
            const decodedEvaluatorId = decodeURIComponent(evaluatorId as string);
            const foundBill = allBills.find(b => b.evaluatorId === decodedEvaluatorId);

            if (foundBill) {
                setBillDetails(foundBill);
            } else {
                toast({ variant: "destructive", title: "Not Found", description: "No bill details found for this evaluator ID." });
                router.push("/bill-form");
            }
        } else if (!storedBills) {
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
  }, [params.evaluatorId, router, toast]);
  
  const handlePrint = () => {
    window.print();
  };

  const handleSaveSettings = () => {
    localStorage.setItem(GLOBAL_BILL_SETTINGS_KEY, JSON.stringify(globalSettings));
    toast({ title: "Settings Saved", description: "The global bill fields have been updated." });
    setIsSettingsOpen(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading bill details...</div>;
  }

  if (!billDetails) {
    // This state could be reached if the bill was not found but before the router redirects.
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
                    background-color: white !important;
                    color: black !important;
                }
                body * {
                    visibility: hidden;
                }
                #print-section, #print-section * {
                    visibility: visible;
                }
                #print-section {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    margin: 0;
                    padding: 1.5cm;
                    box-sizing: border-box;
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
                    filter: none;
                    mix-blend-mode: multiply;
                 }
                .undertaking-page {
                    page-break-before: always;
                }
                .underlined-value {
                    border-bottom: 1px solid black;
                    padding: 0 2px;
                }
                .undertaking-details .underlined-value {
                    display: inline-block;
                    min-width: 200px;
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
                    <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Global Bill Fields</DialogTitle>
                        <DialogDescription>
                            These values will be saved and will appear on all bills.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="billName" className="text-right">Bill Name</Label>
                            <Input
                                id="billName"
                                value={globalSettings.billName}
                                onChange={(e) => setGlobalSettings(s => ({ ...s, billName: e.target.value }))}
                                className="col-span-3"
                                placeholder="e.g., Bill for Sem-I"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="examinationName" className="text-right">Examination Name</Label>
                            <Input
                                id="examinationName"
                                value={globalSettings.examinationName}
                                onChange={(e) => setGlobalSettings(s => ({ ...s, examinationName: e.target.value }))}
                                className="col-span-3"
                                placeholder="e.g., May/June 2024"
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="coordinatorName" className="text-right">Coordinator</Label>
                            <Input
                                id="coordinatorName"
                                value={globalSettings.coordinatorName}
                                onChange={(e) => setGlobalSettings(s => ({ ...s, coordinatorName: e.target.value }))}
                                className="col-span-3"
                                placeholder="e.g., Dr. ABC"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                        <Button type="button" onClick={handleSaveSettings}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Bill</Button>
        </div>
      </header>
      
      <div id="print-section">
        <Card className="shadow-none border-none">
            <CardHeader className="p-4 md:p-6 print:p-0">
                <div className="flex justify-end text-sm">
                    <div className="grid grid-cols-1 gap-1 text-right">
                        <span>Page No. ....................</span>
                        <span>Reg. No. ....................</span>
                    </div>
                </div>
                <div className="text-center">
                    <h1 className="text-xl md:text-2xl font-bold uppercase print-header-title">University of Delhi</h1>
                    <h2 className="text-lg md:text-xl font-bold print-header-subtitle">Central Evaluation Centre, SGTB Khalsa College</h2>
                    <div className="flex items-baseline justify-center">
                        <div className="flex items-baseline">
                           <span className="font-bold">Bill,</span>
                           <Input className="w-auto manual-input font-bold text-center" value={globalSettings.billName} readOnly />
                        </div>
                        <div className="flex items-baseline ml-4">
                           <span className="font-bold">Examination</span>
                           <Input className="w-auto manual-input font-bold text-center" value={globalSettings.examinationName} readOnly />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-base p-4 md:p-6 print:p-0 print:text-sm">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    <div className="flex justify-between items-baseline border-b pb-1">
                        <span className="font-bold shrink-0">Evaluator ID:</span>
                        <span className="text-right">{billDetails.evaluatorId}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b pb-1">
                        <span className="font-bold shrink-0">Evaluator Name:</span>
                        <span className="text-right">{billDetails.evaluatorName}</span>
                    </div>
                     <div className="flex justify-between items-baseline border-b pb-1">
                        <span className="font-bold shrink-0">Address:</span> <span className="text-right">{billDetails.address}</span>
                    </div>
                     <div className="flex justify-between items-baseline border-b pb-1">
                        <span className="font-bold shrink-0">Course:</span> <span className="text-right">{billDetails.course}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b pb-1">
                        <span className="font-bold shrink-0">Email ID:</span>
                        <span className="truncate text-right">{billDetails.email}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b pb-1">
                        <span className="font-bold shrink-0">Mobile No:</span>
                        <span className="text-right">{billDetails.mobileNo}</span>
                    </div>
                     <div className="flex justify-between items-baseline border-b pb-1">
                        <span className="font-bold shrink-0">College Name:</span> <span className="text-right">{billDetails.collegeName}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b pb-1">
                        <span className="font-bold shrink-0">Distance (Km) Up-Down:</span> <span className="text-right">{billDetails.distance}</span>
                    </div>
                </div>


                <div className="pt-2">
                     <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">Bank Name:</span>
                            <span className="text-right">{billDetails.bankName}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">Branch:</span>
                            <span className="text-right">{billDetails.branch}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-8 gap-y-1 mt-1">
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">PAN No.:</span>
                            <span className="text-right">{billDetails.panNo}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">Account No:</span>
                            <span className="font-mono text-right">{billDetails.bankAccountNo}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b pb-1">
                            <span className="font-bold shrink-0">IFSC Code:</span>
                            <span className="font-mono text-right">{billDetails.ifscCode}</span>
                        </div>
                    </div>
                     <div className="flex justify-between">
                        <span>Paper No.........................................................................................................</span>
                        <span className="ml-4">Duration of Paper...................</span>
                    </div>
                </div>
                
                <div className="pt-2">
                    <h3 className="text-center font-bold">Part I Examiner /Additional Examiner</h3>
                    <Table className="mt-1 border print-table w-full">
                         <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold border print-table total-scripts-cell text-xs">Total No. of Ans. Scripts Evaluated</TableHead>
                                <TableHead className="font-bold border print-table text-xs">Rate Per Ans. Script</TableHead>
                                <TableHead className="font-bold border print-table text-xs">Remuneration Claimed</TableHead>
                                <TableHead className="font-bold border print-table text-xs">Total No. of Visits</TableHead>
                                <TableHead className="font-bold border print-table date-of-visits-cell text-xs">Date of Visits:</TableHead>
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
                        <span className="font-bold underline">Optimum no. of Copies</span>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex justify-between items-end">
                        <div className="w-2/3 space-y-1">
                            <h3 className="text-left font-bold">Part II (for use of Head/Additional Head Examiner)</h3>
                            <div className="pt-1">
                                <span>Payment claimed Rs............................................................</span>
                            </div>
                        </div>
                        {billDetails.signature && (
                            <div className="text-center">
                                <div className="flex justify-center items-center rounded-md p-1 min-h-[3rem]">
                                    <img src={billDetails.signature} alt="Evaluator's Signature" className="max-h-12 signature-image" />
                                </div>
                                <h3 className="font-bold text-sm mt-1">Signature of Examiner</h3>
                            </div>
                        )}
                    </div>
                    <hr className="my-2 border-t border-foreground" />
                    <div className="text-center">
                        <span className="font-bold underline">Official Use</span>
                    </div>
                     <div className="pt-2 space-y-1">
                        <div className="flex justify-between items-center">
                            <span>I) Remuneration for the Scripts Valued :</span>
                            <span className="text-right">Rs. ____________________________</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>II) Payment on account of Additional Examiner (If any) :</span>
                            <span className="text-right">Rs. ____________________________</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span>Total of (I+II) :</span>
                           <span className="text-right">Rs. ____________________________</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span>Less: 5% TWF :</span>
                            <span className="text-right">Rs. ____________________________</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Balance :</span>
                            <span className="text-right">Rs. ____________________________</span>
                        </div>
                        <div>
                           <div className="flex justify-between items-center">
                                <span>Conveyance @ Rs. _________ Per day</span>
                                <span className="text-right">Rs. ____________________________</span>
                            </div>
                             <div className="pl-4">
                                <span>(Up to-30 Km Rs.450/- & above Rs. 600/-)</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Refreshment (125x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) :</span>
                            <span className="text-right">Rs. ____________________________</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span>Net Payable :</span>
                            <span className="text-right">Rs. ____________________________</span>
                        </div>
                    </div>
                </div>

                <div className="pt-12">
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            <span className="font-bold">Coordinator</span>
                            <div className="flex items-center text-sm">
                                <span>CEC</span>
                                <Input className="w-auto h-8 manual-input font-bold text-center" value={globalSettings.coordinatorName} readOnly />
                            </div>
                        </div>
                        <span>Dealing Assistant</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="undertaking-page pt-12">
            <h2 className="text-2xl font-bold text-center underline">UNDERTAKING</h2>
            <div className="mt-8 space-y-4 text-base">
                <p className="text-center underline font-bold">EXAMINATION WING</p>
                <p>
                    I clerify that none of my relations (husband, wife, son, daughter, brother, sister, nephew, niece, sister-in-law or daughter-in-law etc.) is a candidate at the Central Evaluation Center where evaluation is being done.
                </p>
                <div className="flex justify-end pt-8">
                    <div className="text-left space-y-1 undertaking-details">
                        <div className="flex justify-between items-baseline"><span className="mr-2">Teacher ID:</span> <span className="underlined-value">{billDetails.evaluatorId}</span></div>
                        <div className="flex justify-between items-baseline"><span className="mr-2">Teacher Name:</span> <span className="underlined-value">{billDetails.evaluatorName}</span></div>
                        <div className="flex justify-between items-baseline"><span className="mr-2">College Name:</span> <span className="underlined-value">{billDetails.collegeName}</span></div>
                        <div className="flex justify-between items-baseline"><span className="mr-2">Mobile No.:</span> <span className="underlined-value">{billDetails.mobileNo}</span></div>
                        <div className="flex justify-between items-baseline"><span className="mr-2">Email ID:</span> <span className="underlined-value">{billDetails.email}</span></div>
                    </div>
                </div>

                <div className="flex justify-end pt-16">
                     {billDetails.signature && (
                        <div className="text-center">
                            <div className="flex justify-center items-center p-1 min-h-[3rem]">
                                <img src={billDetails.signature} alt="Evaluator's Signature" className="max-h-12 signature-image" />
                            </div>
                            <h3 className="font-bold text-sm mt-1">(Signature of the Teacher)</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>

    </div>
  );

}
