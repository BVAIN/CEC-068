
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
import { ISSUES_STORAGE_KEY } from "@/lib/constants";
import type { IssueFormValues } from "@/app/(main)/issue-form/page";

const publicIssueFormSchema = z.object({
  dateOfExam: z.string().min(1, "Date of Exam is required"),
  upc: z.string().min(1, "UPC is required"),
  qpNo: z.string().min(1, "QP No. is required"),
  packetNo: z.string().min(1, "Packet No. is required"),
  asPerChallan: z.coerce.number().min(1, "As per Challan is required"),
  netScripts: z.coerce.number().min(1, "Net Scripts is required"),
  course: z.string().min(1, "Course is required"),
  campus: z.string().min(1, "Please select a campus"),
  schoolType: z.string().min(1, "Please select a school type"),
});

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
      campus: "",
      schoolType: "",
    },
  });

  const onSubmit = (data: z.infer<typeof publicIssueFormSchema>) => {
    console.log("Form Submitted", data);
    
    // In a real app, you would likely save this data.
    // For now we just show a success toast.
    toast({
      title: "Entry Submitted!",
      description: "Your script issue information has been recorded.",
    });
    
    form.reset();
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
                    <FormField control={form.control} name="asPerChallan" render={({ field }) => (<FormItem><FormLabel>As per Challan</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="netScripts" render={({ field }) => (<FormItem><FormLabel>Net Scripts</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
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
                        render={() => (
                            <FormItem>
                                <FormLabel>Campus</FormLabel>
                                <div className="flex gap-4 pt-2">
                                    <FormField
                                        control={form.control}
                                        name="campus"
                                        render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                                <Checkbox checked={field.value === 'North'} onCheckedChange={(checked) => field.onChange(checked ? 'North' : '')}/>
                                            </FormControl>
                                            <FormLabel className="font-normal">North</FormLabel>
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="campus"
                                        render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                                <Checkbox checked={field.value === 'South'} onCheckedChange={(checked) => field.onChange(checked ? 'South' : '')}/>
                                            </FormControl>
                                            <FormLabel className="font-normal">South</FormLabel>
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="schoolType"
                        render={() => (
                            <FormItem>
                                <FormLabel>School Type</FormLabel>
                                <div className="flex gap-4 pt-2">
                                    <FormField
                                        control={form.control}
                                        name="schoolType"
                                        render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                                <Checkbox checked={field.value === 'Regular'} onCheckedChange={(checked) => field.onChange(checked ? 'Regular' : '')}/>
                                            </FormControl>
                                            <FormLabel className="font-normal">Regular</FormLabel>
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="schoolType"
                                        render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                                <Checkbox checked={field.value === 'NCWEB'} onCheckedChange={(checked) => field.onChange(checked ? 'NCWEB' : '')}/>
                                            </FormControl>
                                            <FormLabel className="font-normal">NCWEB</FormLabel>
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="schoolType"
                                        render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                                <Checkbox checked={field.value === 'SOL'} onCheckedChange={(checked) => field.onChange(checked ? 'SOL' : '')}/>
                                            </FormControl>
                                            <FormLabel className="font-normal">SOL</FormLabel>
                                        </FormItem>
                                        )}
                                    />
                                </div>
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
