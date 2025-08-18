
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BILLS_STORAGE_KEY } from "@/lib/constants";
import type { BillFormValues } from "@/app/(main)/bill-form/page";
import { Upload } from "lucide-react";


const publicBillFormSchema = z.object({
  evaluatorId: z.string().min(1, "Evaluator ID is required"),
  evaluatorName: z.string().min(1, "Evaluator Name is required"),
  collegeName: z.string().min(1, "College Name is required"),
  course: z.string().min(1, "Course is required"),
  email: z.string().email("A valid email is required"),
  panNo: z.string().min(1, "PAN No. is required"),
  address: z.string().min(1, "Address is required"),
  distance: z.coerce.number().min(1, "Distance is required"),
  mobileNo: z.string().min(1, "Mobile No. is required"),
  bankName: z.string().min(1, "Bank Name is required"),
  branch: z.string().min(1, "Branch is required"),
  bankAccountNo: z.string().min(1, "Bank Account No. is required"),
  ifscCode: z.string().min(1, "IFSC Code is required"),
  signature: z.string().min(1, "Signature is required"),
});

export default function PublicBillEntryPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BillFormValues | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(publicBillFormSchema),
    defaultValues: {
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

  const goToPreview = (data: BillFormValues) => {
    setFormData(data);
    setStep(2);
  };

  const handleFinalSubmit = () => {
    if (!formData) return;
    
    try {
        const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
        const allBills: BillFormValues[] = storedBills ? JSON.parse(storedBills) : [];
        
        const newBill = { ...formData, id: `${Date.now()}-${formData.evaluatorId}` };
        allBills.push(newBill);

        localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(allBills));

        toast({
            title: "Submission Successful!",
            description: "Your bill has been submitted. Thank you.",
        });
        setStep(3); // Go to success page
    } catch (error) {
        console.error("Failed to save bill:", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "Could not save your bill. Please try again later.",
        });
    }
  };
  

  if (step === 3) {
    return (
       <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
            <div className="w-full max-w-2xl mx-auto text-center">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Submission Successful!</CardTitle>
                        <CardDescription>Your bill information has been recorded. You may now close this window.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </main>
    );
  }

  if (step === 2 && formData) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8">
            <div className="w-full max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Preview and Confirm</CardTitle>
                        <CardDescription>Please review your details below before final submission.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div id="preview-section" className="space-y-6">
                            {/* Bill Preview */}
                            <div className="border rounded-lg p-4">
                                <h3 className="text-lg font-semibold mb-4 text-center">Bill Preview</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <p><strong className="text-muted-foreground">Evaluator ID:</strong> {formData.evaluatorId}</p>
                                    <p><strong className="text-muted-foreground">Evaluator Name:</strong> {formData.evaluatorName}</p>
                                    <p><strong className="text-muted-foreground">College Name:</strong> {formData.collegeName}</p>
                                    <p><strong className="text-muted-foreground">Course:</strong> {formData.course}</p>
                                    <p className="md:col-span-2"><strong className="text-muted-foreground">Address:</strong> {formData.address}</p>
                                    <p><strong className="text-muted-foreground">Email:</strong> {formData.email}</p>
                                    <p><strong className="text-muted-foreground">Mobile No:</strong> {formData.mobileNo}</p>
                                    <p><strong className="text-muted-foreground">PAN No:</strong> {formData.panNo}</p>
                                    <p><strong className="text-muted-foreground">Distance (Km):</strong> {formData.distance}</p>
                                    <p><strong className="text-muted-foreground">Bank Name:</strong> {formData.bankName}</p>
                                    <p><strong className="text-muted-foreground">Branch:</strong> {formData.branch}</p>
                                    <p><strong className="text-muted-foreground">Account No:</strong> {formData.bankAccountNo}</p>
                                    <p><strong className="text-muted-foreground">IFSC Code:</strong> {formData.ifscCode}</p>
                                </div>
                            </div>

                            {/* Undertaking Preview */}
                            <div className="border rounded-lg p-4">
                                <h3 className="text-lg font-semibold mb-2 text-center underline">UNDERTAKING</h3>
                                <p className="text-sm">
                                    I, <span className="font-bold">{formData.evaluatorName}</span>, hereby undertake that I have not evaluated more than 30 answer scripts of UG Courses in a day. I also undertake that I have not been debarred from any evaluation work by the University of Delhi.
                                </p>
                                <div className="flex justify-between items-end mt-8">
                                    <div>
                                        <p className="text-sm"><strong className="text-muted-foreground">Teacher ID:</strong> {formData.evaluatorId}</p>
                                        <p className="text-sm"><strong className="text-muted-foreground">Teacher Name:</strong> {formData.evaluatorName}</p>
                                    </div>
                                    {signaturePreview && (
                                        <div className="text-center">
                                            <img src={signaturePreview} alt="Signature" className="max-h-12 border rounded-md p-1" />
                                            <p className="text-xs font-semibold mt-1">(Signature of the Teacher)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <div className="flex justify-end gap-4 p-6">
                        <Button variant="outline" onClick={() => setStep(1)}>Go Back & Edit</Button>
                        <Button onClick={handleFinalSubmit}>Submit</Button>
                    </div>
                </Card>
            </div>
        </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(goToPreview)} className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Bill Form And Undertaking</CardTitle>
                    <CardDescription>Please fill out your details to submit the bill.</CardDescription>
                </CardHeader>
             </Card>
             <Card>
                <CardHeader>
                <CardTitle>Evaluator Details</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="evaluatorId" render={({ field }) => (<FormItem><FormLabel>Evaluator ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="evaluatorName" render={({ field }) => (<FormItem><FormLabel>Evaluator Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="collegeName" render={({ field }) => (<FormItem><FormLabel>College Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="course" render={({ field }) => (<FormItem><FormLabel>Course</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email ID</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="mobileNo" render={({ field }) => (<FormItem><FormLabel>Mobile No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="distance" render={({ field }) => (<FormItem><FormLabel>Distance (Km) Up-Down</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Bank Details</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="bankAccountNo" render={({ field }) => (<FormItem><FormLabel>Bank Account No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="ifscCode" render={({ field }) => (<FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="panNo" render={({ field }) => (<FormItem><FormLabel>PAN No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="signature" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Upload Signature</FormLabel>
                             <FormControl>
                                <div>
                                    <Input id="signature-upload" type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleSignatureUpload} className="hidden" />
                                    <Button type="button" onClick={() => document.getElementById('signature-upload')?.click()} variant="outline">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Choose File
                                    </Button>
                                </div>
                            </FormControl>
                            {signaturePreview && <img src={signaturePreview} alt="Signature Preview" className="mt-2 h-20 border rounded-md" />}
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button type="submit" size="lg">Next: Preview</Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}

    