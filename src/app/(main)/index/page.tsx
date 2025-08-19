
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IndexPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Index</h1>
        <p className="text-lg text-muted-foreground mt-2">Index page for your application.</p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Index Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a placeholder page for the Index section.</p>
        </CardContent>
      </Card>
    </div>
  );
}
