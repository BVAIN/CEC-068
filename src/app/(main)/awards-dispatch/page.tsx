
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";

export default function AwardsDispatchPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline lg:text-5xl">Awards Dispatch Data</h1>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
            <Award className="w-16 h-16 mb-4" />
            <p className="text-lg">This section is under construction.</p>
            <p>Check back later for updates on awards dispatch data management.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    