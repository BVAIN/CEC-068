
"use client";

import { useState, useEffect } from "react";
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

export default function PublicBillEntryPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BillFormValues | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(publicBillFormSchema),
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

  const { watch, setValue } = form;
  const watchedEvaluatorId = watch('evaluatorId');

  useEffect(() => {
    if (watchedEvaluatorId) {
      try {
        const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
        if (storedBills) {
          const allBills: BillFormValues[] = JSON.parse(storedBills);
          const existingBill = allBills.find(bill => bill.evaluatorId === watchedEvaluatorId);
          if (existingBill) {
            form.reset(existingBill);
            setSignaturePreview(existingBill.signature);
            toast({
              title: "Existing Record Found",
              description: "Your details have been pre-filled. You can now update them.",
            });
          }
        }
      } catch (error) {
        console.error("Error reading from localStorage:", error);
      }
    }
  }, [watchedEvaluatorId, form, toast]);


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
        let allBills: BillFormValues[] = storedBills ? JSON.parse(storedBills) : [];
        
        const existingBillIndex = allBills.findIndex(bill => bill.evaluatorId === formData.evaluatorId);

        if (existingBillIndex > -1) {
            // Update existing entry
            const existingBill = allBills[existingBillIndex];
            allBills[existingBillIndex] = { ...formData, id: existingBill.id };
            setLastSubmittedId(existingBill.id!);
        } else {
            // Create new entry
            const newBill = { ...formData, id: `${Date.now()}-${formData.evaluatorId}` };
            allBills.push(newBill);
            setLastSubmittedId(newBill.id);
        }

        localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(allBills));

        toast({
            title: "Submission Successful!",
            description: "Your bill has been submitted. Thank you.",
        });
        setStep(3); // Go to success page
    } catch (error) {
        if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
             toast({
                variant: 'destructive',
                title: 'Storage Full',
                description: "Browser's local storage is full. Could not save your submission."
            });
        } else {
             console.error("Failed to save bill:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Could not save your bill. Please try again later.",
            });
        }
    }
  };

  const handleEditLastSubmission = () => {
    if (!lastSubmittedId) return;

    try {
        const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
        const allBills: BillFormValues[] = storedBills ? JSON.parse(storedBills) : [];
        const lastSubmission = allBills.find(bill => bill.id === lastSubmittedId);

        if (lastSubmission) {
          form.reset(lastSubmission);
          setSignaturePreview(lastSubmission.signature);
          setStep(1);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find the submission to edit.",
          });
        }
    } catch(error) {
        console.error("Error loading last submission for edit:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load your previous submission.",
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
                        <CardDescription>Your bill information has been recorded. You may now close this window or edit your submission.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button onClick={handleEditLastSubmission}>Edit Submission</Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
  }

  if (step === 2 && formData) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
            <div className="w-full max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Preview and Confirm</CardTitle>
                        <CardDescription>Please review your details below before final submission.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div id="preview-section" className="space-y-6">
                            <div className="border rounded-lg p-6 space-y-4">
                                <h3 className="text-xl font-semibold mb-4 text-center">Bill Preview</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">Evaluator ID:</span><span className="p-2 border rounded-md bg-muted/50">{formData.evaluatorId}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">Evaluator Name:</span><span className="p-2 border rounded-md bg-muted/50">{formData.evaluatorName}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">College Name:</span><span className="p-2 border rounded-md bg-muted/50">{formData.collegeName}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">Course:</span><span className="p-2 border rounded-md bg-muted/50">{formData.course}</span></div>
                                    <div className="flex flex-col space-y-1 md:col-span-2"><span className="font-semibold text-muted-foreground">Address:</span><span className="p-2 border rounded-md bg-muted/50">{formData.address}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">Email:</span><span className="p-2 border rounded-md bg-muted/50">{formData.email}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">Mobile No:</span><span className="p-2 border rounded-md bg-muted/50">{formData.mobileNo}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">PAN No:</span><span className="p-2 border rounded-md bg-muted/50">{formData.panNo}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">Distance (Km):</span><span className="p-2 border rounded-md bg-muted/50">{formData.distance}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">Bank Name:</span><span className="p-2 border rounded-md bg-muted/50">{formData.bankName}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">Branch:</span><span className="p-2 border rounded-md bg-muted/50">{formData.branch}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">Account No:</span><span className="p-2 border rounded-md bg-muted/50">{formData.bankAccountNo}</span></div>
                                    <div className="flex flex-col space-y-1"><span className="font-semibold text-muted-foreground">IFSC Code:</span><span className="p-2 border rounded-md bg-muted/50">{formData.ifscCode}</span></div>
                                </div>
                            </div>
                            <div className="border rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-4 text-center underline">UNDERTAKING</h3>
                                <p className="text-base leading-relaxed">
                                    I, <span className="font-bold">{formData.evaluatorName}</span>, hereby undertake that I have not evaluated more than 30 answer scripts of UG Courses in a day. I also undertake that I have not been debarred from any evaluation work by the University of Delhi.
                                </p>
                                <div className="flex justify-between items-end mt-12">
                                    <div className="space-y-2">
                                        <p className="text-sm"><strong className="text-muted-foreground">Teacher ID:</strong> {formData.evaluatorId}</p>
                                        <p className="text-sm"><strong className="text-muted-foreground">Teacher Name:</strong> {formData.evaluatorName}</p>
                                    </div>
                                    {signaturePreview && (
                                        <div className="text-center">
                                            <img src={signaturePreview} alt="Signature" className="max-h-16 border rounded-md p-1 bg-white" />
                                            <p className="text-sm font-semibold mt-1">(Signature of the Teacher)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <div className="flex justify-end gap-4 p-6">
                        <Button variant="outline" size="lg" onClick={() => setStep(1)}>Go Back & Edit</Button>
                        <Button onClick={handleFinalSubmit} size="lg">Submit</Button>
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
                    <CardDescription>Please fill out your details to submit the bill. If you have submitted before, enter your Evaluator ID to pre-fill your details.</CardDescription>
                </CardHeader>
             </Card>
             <Card>
                <CardHeader>
                <CardTitle>{form.getValues('id') ? 'Edit Bill' : 'Evaluator Details'}</CardTitle>
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
            <div className="flex justify-end">
                <Button type="submit" size="lg">Next: Preview</Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}

    