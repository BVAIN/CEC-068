
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function IndexPage() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Index</h1>
        <p className="text-lg text-muted-foreground mt-2">Select a campus to view its forms.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Button
          className="h-32 text-2xl font-bold"
          onClick={() => handleNavigation('/issue-form')}
        >
          North
        </Button>
        <Button
          variant="destructive"
          className="h-32 text-2xl font-bold"
          onClick={() => handleNavigation('/bill-form')}
        >
          South
        </Button>
        <Button
          className="h-32 text-2xl font-bold bg-green-500 hover:bg-green-600 text-white"
          onClick={() => handleNavigation('/entry')}
        >
          Add Entry
        </Button>
      </div>
    </div>
  );
}
