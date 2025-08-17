
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { IssueFormValues } from "../issue-form/page";
import type { BillFormValues } from "../bill-form/page";
import { ISSUES_STORAGE_KEY, BILLS_STORAGE_KEY } from "@/lib/constants";

export default function HomePage() {
  const [totalScripts, setTotalScripts] = useState(0);
  const [totalEvaluatedScripts, setTotalEvaluatedScripts] = useState(0);
  const [totalBills, setTotalBills] = useState(0);

  useEffect(() => {
    try {
      const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
      if (storedIssues) {
        const issues: IssueFormValues[] = JSON.parse(storedIssues);
        const totalScriptsCount = issues.reduce((acc, issue) => acc + (issue.noOfScripts || 0), 0);
        const totalEvaluatedScriptsCount = issues
          .filter(issue => issue.received)
          .reduce((acc, issue) => acc + (issue.noOfScripts || 0) + (issue.extraSheets || 0), 0);
        
        setTotalScripts(totalScriptsCount);
        setTotalEvaluatedScripts(totalEvaluatedScriptsCount);
      }

      const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
      if (storedBills) {
        const bills: BillFormValues[] = JSON.parse(storedBills);
        setTotalBills(bills.length);
      }

    } catch (error) {
      console.error("Error calculating totals from localStorage:", error);
    }
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline lg:text-5xl">Welcome to CEC-068</h1>
        <p className="text-lg text-muted-foreground mt-2">Your data management dashboard.</p>
      </header>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader>
                <CardTitle>Total Scripts Issued</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">{totalScripts}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Total Evaluated scripts at CEC</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">{totalEvaluatedScripts}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Total Bills Submitted</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">{totalBills}</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
