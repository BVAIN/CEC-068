
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle } from "lucide-react";
import { BILLS_STORAGE_KEY } from "@/lib/constants";

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


export default function PublicBillEntryPage() {
  const { toast } = useToast();
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
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

  async function onSubmit(data: BillFormValues) {
    try {
        const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
        const allBills: BillFormValues[] = storedBills ? JSON.parse(storedBills) : [];
        
        const newBill = { ...data, id: `${Date.now()}-${data.evaluatorId}` };
        const newBills = [...allBills, newBill];

        localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(newBills));
        
        toast({ title: "Submission Successful", description: "Your bill details have been submitted." });
        form.reset();
        setSignaturePreview(null);
        setIsSubmitted(true);
    } catch (error) {
        console.error("Error submitting form:", error);
        toast({ variant: "destructive", title: "Submission Error", description: "Could not submit your details. Please try again." });
    }
  }
  
  if (isSubmitted) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
            <div className="w-full max-w-2xl mx-auto">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardTitle className="text-2xl">Submission Received</CardTitle>
                        <CardDescription className="mt-2 text-base">
                            Thank you for submitting your details. You can now close this window.
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 sm:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-center font-headline tracking-tight">Bill Submission Form</h1>
          <p className="text-muted-foreground mt-2">Please fill out your details accurately.</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal & College Details</CardTitle>
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
                  <CardTitle>Bank & PAN Details</CardTitle>
               </CardHeader>
               <CardContent className="grid md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="bankAccountNo" render={({ field }) => (<FormItem><FormLabel>Bank Account No.</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="ifscCode" render={({ field }) => (<FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="panNo" render={({ field }) => (<FormItem><FormLabel>PAN No.</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <div className="space-y-2">
                      <FormLabel>Signature of examiner</FormLabel>
                      <Input id="signature-upload" type="file" accept="image/png, image/jpeg" onChange={handleSignatureUpload} className="hidden" />
                      <Button type="button" onClick={() => document.getElementById('signature-upload')?.click()} variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Signature
                      </Button>
                      {signaturePreview && <img src={signaturePreview} alt="Signature Preview" className="mt-2 h-20 border rounded-md object-contain" />}
                  </div>
               </CardContent>
            </Card>
            <CardFooter className="justify-end">
              <Button type="submit" size="lg">Submit Details</Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </main>
  );
}

