
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function IndexPage() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-headline">Index</h1>
          <p className="text-lg text-muted-foreground mt-2">Select a campus to view its forms.</p>
        </div>
        <Button
          className="bg-green-500 hover:bg-green-600 text-white"
          onClick={() => handleNavigation('/entry')}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        <Button
          className="h-48 text-3xl font-bold"
          onClick={() => handleNavigation('/issue-form')}
        >
          North
        </Button>
        <Button
          variant="destructive"
          className="h-48 text-3xl font-bold"
          onClick={() => handleNavigation('/bill-form')}
        >
          South
        </Button>
      </div>
    </div>
  );
}
