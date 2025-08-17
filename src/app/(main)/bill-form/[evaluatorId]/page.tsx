
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BillFormValues } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";


const BILLS_STORAGE_KEY = 'cec068_bills';

export default function BillViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [billDetails, setBillDetails] = useState<BillFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const evaluatorId = params.evaluatorId;
    try {
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading bill details...</div>;
  }

  if (!billDetails) {
    // This state could be reached if the bill was not found but before the router redirects.
    return <div className="flex justify-center items-center h-full">No bill details found. Redirecting...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <style>{`
            @media print {
                body, .main-layout {
                    background-color: white !important;
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
                    padding: 0;
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
                    border: 1px solid black;
                    border-collapse: collapse;
                }
            }
        `}</style>

      <header className="flex items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/bill-form')}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-4xl font-bold tracking-tight font-headline">Bill Details</h1>
                <p className="text-lg text-muted-foreground mt-2">Viewing details for {billDetails.evaluatorName}.</p>
            </div>
        </div>
        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Bill</Button>
      </header>
      
      <div id="print-section">
        <Card className="shadow-none border-none">
            <CardHeader className="p-4 md:p-6">
                 <div className="flex justify-end text-sm">
                    <div className="grid grid-cols-1 gap-1 text-right">
                        <span>Page No. ....................</span>
                        <span>Reg. No. ....................</span>
                    </div>
                </div>
                <div className="text-center space-y-1 mt-4">
                    <h1 className="text-xl md:text-2xl font-bold uppercase">University of Delhi</h1>
                    <h2 className="text-lg md:text-xl font-bold">Central Evaluation Centre, SGTB Khalsa College</h2>
                </div>
                 <div className="flex items-center justify-center gap-2 md:gap-4 pt-4">
                    <span className="font-bold">Bill,</span>
                    <Input className="w-[180px] manual-input" />
                    <span className="font-bold">Examination</span>
                    <Input className="w-[120px] manual-input" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 text-base p-4 md:p-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium text-muted-foreground">Evaluator ID:</span>
                        <span>{billDetails.evaluatorId}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium text-muted-foreground">Evaluator Name:</span>
                        <span>{billDetails.evaluatorName}</span>
                    </div>
                     <div className="flex justify-between border-b pb-2 col-span-2">
                        <span className="font-medium text-muted-foreground">Address:</span>
                        <span>{billDetails.address}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium text-muted-foreground">Email ID:</span>
                        <span className="truncate">{billDetails.email}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium text-muted-foreground">Mobile No:</span>
                        <span>{billDetails.mobileNo}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium text-muted-foreground">College Name:</span>
                        <span>{billDetails.collegeName}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium text-muted-foreground">Distance (Km) Up-Down:</span>
                        <span>{billDetails.distance}</span>
                    </div>
                </div>

                <div className="pt-4">
                    <h3 className="font-semibold text-lg mb-4 text-center">Bank Account Details</h3>
                     <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-muted-foreground">Bank Name:</span>
                            <span>{billDetails.bankName}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-muted-foreground">Branch:</span>
                            <span>{billDetails.branch}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-8 gap-y-4 mt-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-muted-foreground">PAN No.:</span>
                            <span>{billDetails.panNo}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-muted-foreground">Account No:</span>
                            <span className="font-mono">{billDetails.bankAccountNo}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-muted-foreground">IFSC Code:</span>
                            <span className="font-mono">{billDetails.ifscCode}</span>
                        </div>
                    </div>
                </div>
                
                 <div className="pt-6 flex justify-between items-center text-sm">
                    <span>Paper No. ..................................................................................................................</span>
                    <span>Duration of Paper ..................</span>
                </div>

                <div className="pt-6">
                    <h3 className="text-center font-bold">Part I Examiner /Additional Examiner</h3>
                    <Table className="mt-4 border print-table w-full">
                         <colgroup>
                            <col style={{ width: '40%' }} />
                            <col style={{ width: '60%' }} />
                        </colgroup>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium border print-table">Total No. of Ans. Scripts Evaluation</TableCell>
                                <TableCell className="border print-table"></TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium border print-table">Rate Per Ans. Script</TableCell>
                                <TableCell className="border print-table"></TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium border print-table">Remuneration Claimed</TableCell>
                                <TableCell className="border print-table"></TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium border print-table">Total No. of Visits</TableCell>
                                <TableCell className="border print-table"></TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium border print-table py-4" colSpan={2}>
                                    Date of Visits: 
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <div className="text-center pt-4">
                        <span className="font-bold underline">Optimum no. of Copies</span>
                    </div>
                </div>

                <div className="pt-8">
                    <div className="flex justify-between items-end">
                        <div className="w-2/3">
                            <h3 className="text-left font-semibold">Part II (for use of Head/Additional Head Examiner)</h3>
                            <div className="pt-4">
                                <span>Payment claimed Rs............................................................</span>
                            </div>
                        </div>
                        {billDetails.signature && (
                            <div className="text-center">
                                <div className="flex justify-center items-center rounded-md p-1 min-h-[4rem]">
                                    <img src={billDetails.signature} alt="Evaluator's Signature" className="max-h-12" />
                                </div>
                                <h3 className="font-semibold text-sm mt-2">Signature of examiner</h3>
                            </div>
                        )}
                    </div>
                    <div className="pt-2">__________________________________________________________________________________________________</div>
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
