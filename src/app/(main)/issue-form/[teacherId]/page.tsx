
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
  const [teacherInfo, setTeacherInfo] = useState<IssueFormValues | null>(null);

  useEffect(() => {
    const teacherId = params.teacherId;
    const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (storedIssues && teacherId) {
      const allIssues: IssueFormValues[] = JSON.parse(storedIssues);
      const decodedTeacherId = decodeURIComponent(teacherId as string);
      const foundIssues = allIssues.filter(i => i.teacherId === decodedTeacherId);
      
      if (foundIssues.length > 0) {
        setTeacherIssues(foundIssues);
        setTeacherInfo(foundIssues[0]);
      } else {
        toast({ variant: "destructive", title: "Error", description: "No issues found for this teacher." });
        router.push("/issue-form");
      }
    }
  }, [params.teacherId, router, toast]);
  
  if (!teacherInfo) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  const totalScripts = teacherIssues.reduce((acc, issue) => acc + (issue.noOfScripts || 0), 0);
  const totalAbsent = teacherIssues.reduce((acc, issue) => acc + (issue.noOfAbsent || 0), 0);
  const netScripts = totalScripts - totalAbsent;
  const totalVisits = new Set(teacherIssues.map(issue => issue.dateOfIssue)).size;


  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/issue-form')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-4xl font-bold tracking-tight font-headline">Issue Details</h1>
            <p className="text-lg text-muted-foreground mt-2">Viewing all issues for {teacherInfo.teacherName} ({teacherInfo.teacherId}).</p>
        </div>
      </header>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Packet-wise Information</CardTitle>
                    {teacherIssues.length > 0 && (
                        <CardDescription>
                            Teacher: {teacherIssues[0].teacherName} ({teacherIssues[0].campus})
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Packet No.</TableHead>
                                <TableHead>Date of Issue</TableHead>
                                <TableHead>Course</TableHead>
                                <TableHead>Range & Campus</TableHead>
                                <TableHead>Type</TableHead>
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
                                    <TableCell>{issue.course}</TableCell>
                                    <TableCell>{issue.packetFrom} - {issue.packetTo} ({issue.campus})</TableCell>
                                    <TableCell>{issue.schoolType}</TableCell>
                                    <TableCell>{issue.noOfScripts}</TableCell>
                                    <TableCell>{issue.noOfAbsent}</TableCell>
                                    <TableCell>{issue.received ? 'Yes' : 'No'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

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
            <Card>
                <CardHeader>
                    <CardTitle>Teacher Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Token No:</span>
                        <span>{teacherInfo.tokenNo}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Name:</span>
                        <span>{teacherInfo.teacherName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">ID:</span>
                        <span>{teacherInfo.teacherId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">College:</span>
                        <span>{teacherInfo.college}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Mobile:</span>
                        <span>{teacherInfo.mobileNo}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Email:</span>
                        <span className="truncate">{teacherInfo.email}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Total Visits:</span>
                        <span>{totalVisits}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
