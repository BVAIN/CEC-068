
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import type { IssueFormValues } from "../issue-form/page";
import type { BillFormValues } from "../bill-form/page";
import { ISSUES_STORAGE_KEY, BILLS_STORAGE_KEY, PUBLIC_ISSUES_STORAGE_KEY } from "@/lib/constants";
import type { PublicIssueFormValues } from "@/app/(public)/entry/page";
import { Separator } from "@/components/ui/separator";

type ScriptStats = {
  asPerChallan: number;
  netScripts: number;
  difference: number;
};

export default function HomePage() {
  const [totalScripts, setTotalScripts] = useState(0);
  const [totalEvaluatedScripts, setTotalEvaluatedScripts] = useState(0);
  const [totalBills, setTotalBills] = useState(0);

  const [regularStats, setRegularStats] = useState<ScriptStats>({ asPerChallan: 0, netScripts: 0, difference: 0 });
  const [ncwebStats, setNcwebStats] = useState<ScriptStats>({ asPerChallan: 0, netScripts: 0, difference: 0 });
  const [solStats, setSolStats] = useState<ScriptStats>({ asPerChallan: 0, netScripts: 0, difference: 0 });
  const [allDataStats, setAllDataStats] = useState<ScriptStats>({ asPerChallan: 0, netScripts: 0, difference: 0 });


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

      const storedPublicIssues = localStorage.getItem(PUBLIC_ISSUES_STORAGE_KEY);
      if (storedPublicIssues) {
          const publicIssues: PublicIssueFormValues[] = JSON.parse(storedPublicIssues);
          
          const calculateStats = (type: "Regular" | "NCWEB" | "SOL"): ScriptStats => {
              const filtered = publicIssues.filter(issue => issue.type === type);
              const asPerChallan = filtered.reduce((acc, issue) => acc + (issue.asPerChallan || 0), 0);
              const netScripts = filtered.reduce((acc, issue) => acc + (issue.netScripts || 0), 0);
              return { asPerChallan, netScripts, difference: asPerChallan - netScripts };
          };

          const regular = calculateStats("Regular");
          const ncweb = calculateStats("NCWEB");
          const sol = calculateStats("SOL");

          setRegularStats(regular);
          setNcwebStats(ncweb);
          setSolStats(sol);

          setAllDataStats({
              asPerChallan: regular.asPerChallan + ncweb.asPerChallan + sol.asPerChallan,
              netScripts: regular.netScripts + ncweb.netScripts + sol.netScripts,
              difference: regular.difference + ncweb.difference + sol.difference,
          });
      }


    } catch (error) {
      console.error("Error calculating totals from localStorage:", error);
    }
  }, []);
  
  const StatCard = ({ title, stats }: { title: string, stats: ScriptStats }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">As Per Challan:</span>
          <span className="font-medium">{stats.asPerChallan}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Net Scripts:</span>
          <span className="font-medium">{stats.netScripts}</span>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full font-bold text-base">
          <span>Difference:</span>
          <span>{stats.difference}</span>
        </div>
      </CardFooter>
    </Card>
  );

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

       <Separator />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Regular" stats={regularStats} />
        <StatCard title="NCWEB" stats={ncwebStats} />
        <StatCard title="SOL" stats={solStats} />
        <StatCard title="All Data" stats={allDataStats} />
      </div>

    </div>
  );
}
