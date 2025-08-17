
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BillFormValues } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BILLS_STORAGE_KEY = 'cec068_bills';

export default function BillViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [billDetails, setBillDetails] = useState<BillFormValues | null>(null);

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
        }
    } catch (error) {
        console.error("Error parsing localStorage data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load bill details." });
        router.push("/bill-form");
    }
  }, [params.evaluatorId, router, toast]);
  
  const handlePrint = () => {
    window.print();
  };

  if (!billDetails) {
    return <div className="flex justify-center items-center h-full">Loading bill details...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <style>{`
            @media print {
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
                }
                .no-print {
                    display: none;
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
        <Card>
            <CardHeader>
                <CardTitle className="text-center text-2xl">Remuneration Bill</CardTitle>
                <CardDescription className="text-center">For the Evaluation of Answer Scripts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-lg p-8">
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
                        <span className="font-medium text-muted-foreground">Mobile No:</span>
                        <span>{billDetails.mobileNo}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium text-muted-foreground">Distance (Km) Up-Down:</span>
                        <span>{billDetails.distance}</span>
                    </div>
                </div>

                <div className="pt-6">
                    <h3 className="font-semibold text-xl mb-4 text-center">Bank Account Details</h3>
                     <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-muted-foreground">Bank Name:</span>
                            <span>{billDetails.bankName}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium text-muted-foreground">Branch:</span>
                            <span>{billDetails.branch}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 col-span-2">
                            <span className="font-medium text-muted-foreground">Account No:</span>
                            <span className="font-mono">{billDetails.bankAccountNo}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}

