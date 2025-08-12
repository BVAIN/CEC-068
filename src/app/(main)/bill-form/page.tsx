"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const billFormSchema = z.object({
  billTo: z.string().min(1, "Recipient is required"),
  billFrom: z.string().min(1, "Sender is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
  })).min(1, "At least one item is required"),
});

type BillFormValues = z.infer<typeof billFormSchema>;

export default function BillFormPage() {
  const { toast } = useToast();

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      billTo: "",
      billFrom: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
      items: [{ description: "", quantity: 1, price: 0 }],
    },
  });

  function onSubmit(data: BillFormValues) {
    console.log(data);
    toast({
      title: "Bill Saved",
      description: "Your bill has been successfully saved (check console).",
    });
    form.reset();
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Bill Form</h1>
        <p className="text-lg text-muted-foreground mt-2">Create and manage your bills here.</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill Details</CardTitle>
              <CardDescription>Fill in the sender and recipient details for the bill.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="billTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill To</FormLabel>
                    <FormControl><Input placeholder="Client Name or Company" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill From</FormLabel>
                    <FormControl><Input placeholder="Your Name or Company" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Add items to the bill. For this demo, only one item is supported.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-x-4 mb-2">
                <div className="col-span-6"><Label>Description</Label></div>
                <div className="col-span-3"><Label>Quantity</Label></div>
                <div className="col-span-3"><Label>Price</Label></div>
              </div>
              <div className="grid grid-cols-12 gap-x-4 items-start">
                  <FormField
                    control={form.control}
                    name="items.0.description"
                    render={({ field }) => (
                      <FormItem className="col-span-6"><FormControl><Input placeholder="e.g. Web Development Services" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="items.0.quantity"
                    render={({ field }) => (
                      <FormItem className="col-span-3"><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="items.0.price"
                    render={({ field }) => (
                      <FormItem className="col-span-3"><FormControl><Input type="number" step="0.01" placeholder="100.00" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
              </div>
              <FormMessage className="mt-2">{form.formState.errors.items?.root?.message}</FormMessage>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Add any additional notes, terms, or payment instructions.</CardDescription>
            </CardHeader>
            <CardContent>
               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="e.g. Payment is due within 30 days." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg">Save Bill</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
