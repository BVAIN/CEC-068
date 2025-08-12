
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
  const [teacherIssues, setTeacherIssues] = useState<IssueFormValues[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<{name: string, id: string} | null>(null);

  useEffect(() => {
    const teacherId = params.teacherId;
    const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (storedIssues && teacherId) {
      const allIssues: IssueFormValues[] = JSON.parse(storedIssues);
      const decodedTeacherId = decodeURIComponent(teacherId as string);
      const foundIssues = allIssues.filter(i => i.teacherId === decodedTeacherId);
      
      if (foundIssues.length > 0) {
        setTeacherIssues(foundIssues);
        setTeacherInfo({ name: foundIssues[0].teacherName, id: foundIssues[0].teacherId });
      } else {
        toast({ variant: "destructive", title: "Error", description: "No issues found for this teacher." });
        router.push("/issue-form");
      }
    }
  }, [params.teacherId, router, toast]);

  const updateIssueState = (index: number, updatedIssue: IssueFormValues) => {
    const newTeacherIssues = [...teacherIssues];
    newTeacherIssues[index] = updatedIssue;
    setTeacherIssues(newTeacherIssues);

    const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (storedIssues) {
        const allIssues: IssueFormValues[] = JSON.parse(storedIssues);
        const issueToUpdateIndex = allIssues.findIndex(i => i.teacherId === updatedIssue.teacherId && i.packetNo === updatedIssue.packetNo);
        if(issueToUpdateIndex !== -1) {
            allIssues[issueToUpdateIndex] = updatedIssue;
            localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(allIssues));
        }
    }
  };
  
  const handleSaveChanges = (index: number) => {
    toast({ title: "Changes Saved", description: "The issue details have been updated." });
    // The state is already updated, and local storage is updated on change.
    // This button can just provide feedback.
  };

  const handleRowDataChange = (index: number, field: keyof IssueFormValues, value: any) => {
      const issueToUpdate = teacherIssues[index];
      const updatedIssue = { ...issueToUpdate, [field]: value };
      updateIssueState(index, updatedIssue);
  };
  
  if (!teacherInfo) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  const totalScripts = teacherIssues.reduce((acc, issue) => acc + (issue.noOfScripts || 0), 0);
  const totalAbsent = teacherIssues.reduce((acc, issue) => acc + (issue.noOfAbsent || 0), 0);
  const netScripts = totalScripts - totalAbsent;

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/issue-form')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-4xl font-bold tracking-tight font-headline">Issue Details</h1>
            <p className="text-lg text-muted-foreground mt-2">Viewing all issues for {teacherInfo.name} ({teacherInfo.id}).</p>
        </div>
      </header>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Packet-wise Information</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Packet No.</TableHead>
                            <TableHead>Date of Issue</TableHead>
                            <TableHead>Range</TableHead>
                            <TableHead>No. of Scripts</TableHead>
                            <TableHead>No. of Absent</TableHead>
                            <TableHead>Received</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teacherIssues.map((issue, index) => (
                             <TableRow key={issue.packetNo}>
                                <TableCell>{issue.packetNo}</TableCell>
                                <TableCell>{issue.dateOfIssue}</TableCell>
                                <TableCell>{issue.packetFrom} - {issue.packetTo}</TableCell>
                                <TableCell>{issue.noOfScripts}</TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        value={issue.noOfAbsent || ''} 
                                        onChange={(e) => handleRowDataChange(index, 'noOfAbsent', parseInt(e.target.value, 10) || 0)}
                                        className="w-20"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Checkbox
                                        checked={issue.received}
                                        onCheckedChange={(checked) => handleRowDataChange(index, 'received', !!checked)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <div className="space-y-6">
             <Card>
                <CardHeader><CardTitle>Total Script Calculation</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between"><span>Total No. of Scripts:</span> <span>{totalScripts}</span></div>
                    <div className="flex justify-between"><span>Total No. of Absent:</span> <span>{totalAbsent}</span></div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold"><span>Net Total Scripts:</span> <span>{netScripts}</span></div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    