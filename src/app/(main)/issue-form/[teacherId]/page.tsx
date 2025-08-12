
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { IssueFormValues } from "../page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

const ISSUES_STORAGE_KEY = 'cec068_issues';

export default function IssueViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [issue, setIssue] = useState<IssueFormValues | null>(null);
  const [originalIndex, setOriginalIndex] = useState<number | null>(null);

  useEffect(() => {
    const teacherId = params.teacherId;
    const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (storedIssues && teacherId) {
      const issues: IssueFormValues[] = JSON.parse(storedIssues);
      const decodedTeacherId = decodeURIComponent(teacherId as string);
      const foundIndex = issues.findIndex(i => i.teacherId === decodedTeacherId);
      
      if (foundIndex !== -1) {
        setIssue(issues[foundIndex]);
        setOriginalIndex(foundIndex);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Issue not found." });
        router.push("/issue-form");
      }
    }
  }, [params.teacherId, router, toast]);

  const updateIssuesState = (updatedIssue: IssueFormValues) => {
    const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (storedIssues && originalIndex !== null) {
        const issues = JSON.parse(storedIssues);
        issues[originalIndex] = updatedIssue;
        localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
        setIssue(updatedIssue);
    }
  };

  const handleReceivedChange = (checked: boolean) => {
    if (issue) {
      const updatedIssue = { ...issue, received: checked };
      updateIssuesState(updatedIssue);
    }
  };

  const handleAbsentChange = (value: string) => {
    if (issue) {
      const updatedIssue = { ...issue, noOfAbsent: parseInt(value, 10) || 0 };
      updateIssuesState(updatedIssue);
    }
  };
  
  const handleSaveChanges = () => {
    if (issue) {
      const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
      if (storedIssues && originalIndex !== null) {
        const issues = JSON.parse(storedIssues);
        issues[originalIndex] = issue;
        localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
        toast({ title: "Changes Saved", description: "The issue details have been updated." });
      }
    }
  };

  if (!issue) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  const netScripts = (issue.noOfScripts || 0) - (issue.noOfAbsent || 0);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/issue-form')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-4xl font-bold tracking-tight font-headline">Issue Details</h1>
            <p className="text-lg text-muted-foreground mt-2">Viewing issue for {issue.teacherName}.</p>
        </div>
      </header>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Detailed Information</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                        <TableRow><TableCell className="font-medium">Teacher Name</TableCell><TableCell>{issue.teacherName}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">Teacher ID</TableCell><TableCell>{issue.teacherId}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">Date of Issue</TableCell><TableCell>{issue.dateOfIssue}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">Packet No.</TableCell><TableCell>{issue.packetNo}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">Range</TableCell><TableCell>{issue.packetFrom} - {issue.packetTo}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">QP No.</TableCell><TableCell>{issue.qpNo}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">UPC</TableCell><TableCell>{issue.upc}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">College</TableCell><TableCell>{issue.college}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">Mobile No.</TableCell><TableCell>{issue.mobileNo}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">Email</TableCell><TableCell>{issue.email}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">Type</TableCell><TableCell>{issue.schoolType}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">Campus</TableCell><TableCell>{issue.campus}</TableCell></TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Status & Actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="noOfAbsent">No. of Absent</Label>
                        <Input 
                            id="noOfAbsent"
                            type="number" 
                            value={issue.noOfAbsent || ''} 
                            onChange={(e) => handleAbsentChange(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="received"
                            checked={issue.received}
                            onCheckedChange={(checked) => handleReceivedChange(!!checked)}
                        />
                        <Label htmlFor="received" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Received
                        </Label>
                    </div>
                     <Button onClick={handleSaveChanges} className="w-full">Save Changes</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Script Calculation</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between"><span>No. of Scripts:</span> <span>{issue.noOfScripts}</span></div>
                    <div className="flex justify-between"><span>No. of Absent:</span> <span>{issue.noOfAbsent || 0}</span></div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold"><span>Total Scripts:</span> <span>{netScripts}</span></div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
