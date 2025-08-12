"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { IssueFormValues } from "../issue-form/page";

const ISSUES_STORAGE_KEY = 'cec068_issues';
const TRASH_STORAGE_KEY = 'cec068_trash';

export default function TrashPage() {
  const [trashedIssues, setTrashedIssues] = useState<IssueFormValues[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedTrash = localStorage.getItem(TRASH_STORAGE_KEY);
    if (storedTrash) {
      setTrashedIssues(JSON.parse(storedTrash));
    }
  }, []);

  const updateTrashState = (newTrash: IssueFormValues[]) => {
    setTrashedIssues(newTrash);
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(newTrash));
  };

  const handleRestore = (index: number) => {
    const issueToRestore = trashedIssues[index];
    const newTrash = trashedIssues.filter((_, i) => i !== index);
    updateTrashState(newTrash);

    const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
    const issues = storedIssues ? JSON.parse(storedIssues) : [];
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify([...issues, issueToRestore]));

    toast({
      title: "Issue Restored",
      description: "The issue has been successfully restored.",
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Trash</h1>
        <p className="text-lg text-muted-foreground mt-2">View and restore deleted issues.</p>
      </header>

      {trashedIssues.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Deleted Issues</CardTitle>
            <CardDescription>Here are the issues you have deleted. You can restore them if needed.</CardDescription>
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashedIssues.map((issue, index) => (
                    <TableRow key={index}>
                      <TableCell>{issue.teacherName}</TableCell>
                      <TableCell>{issue.teacherId}</TableCell>
                      <TableCell>{issue.dateOfIssue}</TableCell>
                      <TableCell>{issue.packetNo}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleRestore(index)}>
                          <History className="mr-2 h-4 w-4" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">The trash is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">Deleted issues will appear here.</p>
        </div>
      )}
    </div>
  );
}
