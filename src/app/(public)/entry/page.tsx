
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PUBLIC_ISSUES_STORAGE_KEY } from "@/lib/constants";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const publicIssueFormSchema = z.object({
  id: z.string().optional(),
  dateOfExam: z.string().min(1, "Date of Exam is required"),
  upc: z.string().min(1, "UPC is required"),
  qpNo: z.string().min(1, "QP No. is required"),
  packetNo: z.string().min(1, "Packet No. is required"),
  asPerChallan: z.coerce.number().min(1, "As per Challan is required"),
  netScripts: z.coerce.number().min(1, "Net Scripts is required"),
  course: z.string().min(1, "Course is required"),
  campus: z.enum(["North", "South"], { required_error: "Please select a campus"}),
  type: z.enum(["Regular", "NCWEB", "SOL"], { required_error: "Please select a type"}),
});

export type PublicIssueFormValues = z.infer<typeof publicIssueFormSchema>;

export default function PublicIssueEntryPage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof publicIssueFormSchema>>({
    resolver: zodResolver(publicIssueFormSchema),
    defaultValues: {
      dateOfExam: "",
      upc: "",
      qpNo: "",
      packetNo: "",
      asPerChallan: undefined,
      netScripts: undefined,
      course: "",
      campus: undefined,
      type: undefined,
    },
  });

  const onSubmit = (data: z.infer<typeof publicIssueFormSchema>) => {
    try {
        const storedEntries = localStorage.getItem(PUBLIC_ISSUES_STORAGE_KEY);
        const entries = storedEntries ? JSON.parse(storedEntries) : [];
        const newEntry = { ...data, id: `${Date.now()}-${data.packetNo}` };
        entries.push(newEntry);
        localStorage.setItem(PUBLIC_ISSUES_STORAGE_KEY, JSON.stringify(entries));
        
        toast({
          title: "Entry Submitted!",
          description: "Your script issue information has been recorded.",
        });
        
        form.reset();
    } catch (error) {
        console.error("Error saving to localStorage", error);
        toast({
            variant: "destructive",
            title: "Storage Error",
            description: "Could not save the entry. The browser storage might be full."
        });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">New Script Issue Entry</CardTitle>
                <CardDescription>Please fill out the details below to record a new script packet issue.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Packet Details</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="dateOfExam" render={({ field }) => (<FormItem><FormLabel>Date of Exam</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="upc" render={({ field }) => (<FormItem><FormLabel>UPC</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="qpNo" render={({ field }) => (<FormItem><FormLabel>QP No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="packetNo" render={({ field }) => (<FormItem><FormLabel>Packet No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="asPerChallan" render={({ field }) => (<FormItem><FormLabel>As per Challan</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="netScripts" render={({ field }) => (<FormItem><FormLabel>Net Scripts</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="course" render={({ field }) => (<FormItem><FormLabel>Course</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Classification</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="campus"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Campus</FormLabel>
                                 <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex gap-4 pt-2"
                                    >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="North" />
                                        </FormControl>
                                        <FormLabel className="font-normal">North</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="South" />
                                        </FormControl>
                                        <FormLabel className="font-normal">South</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex gap-4 pt-2"
                                    >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Regular" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Regular</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="NCWEB" />
                                        </FormControl>
                                        <FormLabel className="font-normal">NCWEB</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="SOL" />
                                        </FormControl>
                                        <FormLabel className="font-normal">SOL</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" size="lg">Submit Entry</Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
