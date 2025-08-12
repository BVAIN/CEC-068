"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const issueFormSchema = z.object({
  dateOfIssue: z.string().min(1, "Date of Issue is required"),
  packetFrom: z.string().min(1, "Packet No. (From) is required"),
  packetTo: z.string().min(1, "Packet No. (To) is required"),
  noOfScripts: z.coerce.number().min(1, "Number of Scripts must be at least 1"),
  qpNo: z.string().min(1, "QP No. is required"),
  upc: z.string().min(1, "UPC is required"),
  teacherName: z.string().min(1, "Teacher Name is required"),
  mobileNo: z.string().min(1, "Mobile No. is required"),
  email: z.string().email("Invalid email address"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  college: z.string().min(1, "College is required"),
  campus: z.enum(["North", "South"]),
  schoolType: z.enum(["Regular", "NCWEB", "SOL"]),
});

type IssueFormValues = z.infer<typeof issueFormSchema>;

export default function IssueFormPage() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<IssueFormValues[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<IssueFormValues>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: {
      dateOfIssue: new Date().toISOString().split('T')[0],
      packetFrom: "",
      packetTo: "",
      noOfScripts: 1,
      qpNo: "",
      upc: "",
      teacherName: "",
      mobileNo: "",
      email: "",
      teacherId: "",
      college: "",
      campus: "North",
      schoolType: "Regular"
    },
  });

  function onSubmit(data: IssueFormValues) {
    if (editingIndex !== null) {
      const updatedIssues = [...issues];
      updatedIssues[editingIndex] = data;
      setIssues(updatedIssues);
      setEditingIndex(null);
      toast({
        title: "Issue Updated",
        description: "The issue has been successfully updated.",
      });
    } else {
      setIssues([...issues, data]);
      toast({
        title: "Issue Saved",
        description: "Your issue has been successfully saved.",
      });
    }
    form.reset();
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    form.reset(issues[index]);
  };

  const handleDelete = (index: number) => {
    const newIssues = issues.filter((_, i) => i !== index);
    setIssues(newIssues);
    toast({
      title: "Issue Deleted",
      description: "The issue has been successfully deleted.",
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Issue Form</h1>
        <p className="text-lg text-muted-foreground mt-2">Create and manage teacher issues here.</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
              <CardDescription>Fill in the details for the issue.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <FormField control={form.control} name="dateOfIssue" render={({ field }) => (<FormItem><FormLabel>Date of Issue</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="packetFrom" render={({ field }) => (<FormItem><FormLabel>Packet No. (From)</FormLabel><FormControl><Input placeholder="e.g. 12345" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="packetTo" render={({ field }) => (<FormItem><FormLabel>Packet No. (To)</FormLabel><FormControl><Input placeholder="e.g. 12350" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="noOfScripts" render={({ field }) => (<FormItem><FormLabel>No. of Scripts</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="qpNo" render={({ field }) => (<FormItem><FormLabel>QP No.</FormLabel><FormControl><Input placeholder="e.g. 9876" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="upc" render={({ field }) => (<FormItem><FormLabel>UPC</FormLabel><FormControl><Input placeholder="e.g. 112233" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Teacher Details</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <FormField control={form.control} name="teacherName" render={({ field }) => (<FormItem><FormLabel>Teacher Name</FormLabel><FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="teacherId" render={({ field }) => (<FormItem><FormLabel>Teacher ID</FormLabel><FormControl><Input placeholder="e.g. T-123" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="college" render={({ field }) => (<FormItem><FormLabel>College</FormLabel><FormControl><Input placeholder="e.g. University College" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="mobileNo" render={({ field }) => (<FormItem><FormLabel>Mobile No.</FormLabel><FormControl><Input placeholder="e.g. 9876543210" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="e.g. teacher@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
             <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="campus"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Campus</FormLabel>
                      <FormControl>
                        <div className="flex gap-4">
                           <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value === 'North'} onCheckedChange={(checked) => checked && field.onChange('North')} />
                            </FormControl>
                            <FormLabel className="font-normal">North</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value === 'South'} onCheckedChange={(checked) => checked && field.onChange('South')} />
                            </FormControl>
                            <FormLabel className="font-normal">South</FormLabel>
                          </FormItem>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="schoolType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>School Type</FormLabel>
                      <FormControl>
                         <div className="flex gap-4">
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value === 'Regular'} onCheckedChange={(checked) => checked && field.onChange('Regular')} />
                            </FormControl>
                            <FormLabel className="font-normal">Regular</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                               <Checkbox checked={field.value === 'NCWEB'} onCheckedChange={(checked) => checked && field.onChange('NCWEB')} />
                            </FormControl>
                            <FormLabel className="font-normal">NCWEB</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value === 'SOL'} onCheckedChange={(checked) => checked && field.onChange('SOL')} />
                            </FormControl>
                            <FormLabel className="font-normal">SOL</FormLabel>
                          </FormItem>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg">{editingIndex !== null ? 'Update Issue' : 'Save Issue'}</Button>
          </div>
        </form>
      </Form>

      {issues.length > 0 && (
        <>
        <Separator className="my-8" />
        <Card>
          <CardHeader>
            <CardTitle>Submitted Issues</CardTitle>
            <CardDescription>View and manage the submitted issues.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher Name</TableHead>
                  <TableHead>Teacher ID</TableHead>
                  <TableHead>Date of Issue</TableHead>
                  <TableHead>Packet No.</TableHead>
                  <TableHead>QP No.</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue, index) => (
                  <TableRow key={index}>
                    <TableCell>{issue.teacherName}</TableCell>
                    <TableCell>{issue.teacherId}</TableCell>
                    <TableCell>{issue.dateOfIssue}</TableCell>
                    <TableCell>{issue.packetFrom} - {issue.packetTo}</TableCell>
                    <TableCell>{issue.qpNo}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(index)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
