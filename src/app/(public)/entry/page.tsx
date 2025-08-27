
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getPublicIssuesStorageKey } from "@/lib/constants";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const publicIssueFormSchema = z.object({
  id: z.string().optional(),
  dateOfExam: z.string().min(1, "Date of Exam is required"),
  upc: z.string().optional(),
  qpNo: z.string().optional(),
  pageNo: z.string().optional(),
  asPerChallan: z.coerce.number().min(1, "As per Challan is required"),
  netScripts: z.coerce.number().optional(),
  course: z.string().min(1, "Course is required"),
  campus: z.enum(["North", "South"], { required_error: "Please select a campus"}),
  type: z.enum(["Regular", "NCWEB", "SOL"], { required_error: "Please select a type"}),
  remarks: z.string().optional(),
});

export type PublicIssueFormValues = z.infer<typeof publicIssueFormSchema>;

const initialFormValues: Omit<PublicIssueFormValues, 'campus' | 'type'> & { campus?: "North" | "South", type?: "Regular" | "NCWEB" | "SOL" } = {
  dateOfExam: "",
  upc: "",
  qpNo: "",
  pageNo: "",
  asPerChallan: undefined,
  netScripts: undefined,
  course: "",
  campus: undefined,
  type: undefined,
  remarks: "",
};


export default function PublicIssueEntryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof publicIssueFormSchema>>({
    resolver: zodResolver(publicIssueFormSchema),
    defaultValues: initialFormValues,
  });

  const { watch, setValue, getValues } = form;
  
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
        setEditingId(editId);
        const storedEntries = localStorage.getItem(getPublicIssuesStorageKey());
        if (storedEntries) {
            const entries: PublicIssueFormValues[] = JSON.parse(storedEntries);
            const entryToEdit = entries.find(e => e.id === editId);
            if (entryToEdit) {
                form.reset(entryToEdit);
            }
        }
    }
  }, [searchParams, form]);

  const watchedCourse = watch('course');
  const watchedCampus = watch('campus');
  const watchedType = watch('type');

  const calculateNextPageNo = useCallback(() => {
    if (editingId) return;

    const { course, campus, type } = getValues();
    if (!course || !campus || !type) return;

    const storedEntries = localStorage.getItem(getPublicIssuesStorageKey());
    const entries: PublicIssueFormValues[] = storedEntries ? JSON.parse(storedEntries) : [];

    let relevantEntries: PublicIssueFormValues[];

    if (type === 'SOL') {
        // SOL has its own numbering sequence per course and campus
        relevantEntries = entries.filter(e => e.course === course && e.campus === campus && e.type === 'SOL' && e.pageNo);
    } else {
        // Regular and NCWEB share a numbering sequence per course and campus
        relevantEntries = entries.filter(e => e.course === course && e.campus === campus && (e.type === 'Regular' || e.type === 'NCWEB') && e.pageNo);
    }

    let lastPageNo = 0;
    if (relevantEntries.length > 0) {
        lastPageNo = Math.max(0, ...relevantEntries.map(e => parseInt(e.pageNo!, 10) || 0));
    }

    setValue('pageNo', (lastPageNo + 1).toString());
  }, [editingId, getValues, setValue]);

  useEffect(() => {
      calculateNextPageNo();
  }, [watchedCourse, watchedCampus, watchedType, calculateNextPageNo]);


  const onSubmit = (data: z.infer<typeof publicIssueFormSchema>) => {
    try {
        const storedEntries = localStorage.getItem(getPublicIssuesStorageKey());
        let entries = storedEntries ? JSON.parse(storedEntries) : [];

        if (editingId) {
            entries = entries.map((entry: PublicIssueFormValues) => 
                entry.id === editingId ? { ...entry, ...data } : entry
            );
            toast({ title: "Entry Updated!", description: "Your entry has been updated." });
        } else {
            const newEntry = { ...data, id: `${Date.now()}-${data.pageNo}` };
            entries.push(newEntry);
            toast({
              title: "Entry Submitted!",
              description: "Your script issue information has been recorded.",
            });
        }
        
        localStorage.setItem(getPublicIssuesStorageKey(), JSON.stringify(entries));
        
        if (editingId) {
            router.push('/index');
        } else {
            const keptValues = {
                dateOfExam: data.dateOfExam,
                campus: data.campus,
            };
            form.reset({
                ...initialFormValues,
                ...keptValues,
                course: "",
                pageNo: "",
                upc: "",
                qpNo: "",
                asPerChallan: undefined,
                netScripts: undefined,
            });
        }

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
                <div className="flex items-center justify-between">
                    <CardTitle className="text-3xl">
                        {editingId ? 'Edit Index Entry' : 'Index Entry'}
                    </CardTitle>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>
              </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Paper Details</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="dateOfExam" render={({ field }) => (<FormItem><FormLabel>Date of Exam</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="course" render={({ field }) => (<FormItem><FormLabel>Course</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="upc" render={({ field }) => (<FormItem><FormLabel>UPC</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="qpNo" render={({ field }) => (<FormItem><FormLabel>QP No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="asPerChallan" render={({ field }) => (<FormItem><FormLabel>As per Challan</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="netScripts" render={({ field }) => (<FormItem><FormLabel>Net Scripts</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="pageNo" render={({ field }) => (<FormItem><FormLabel>Page No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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
              <Button type="submit" size="lg">{editingId ? 'Update Entry' : 'Submit Entry'}</Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
