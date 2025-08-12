import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FilePlus, Settings } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline lg:text-5xl">Welcome to CEC-068</h1>
        <p className="text-lg text-muted-foreground mt-2">Manage your data with ease, online and offline.</p>
      </header>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePlus className="w-6 h-6 text-primary" />
              Create New Issue
            </CardTitle>
            <CardDescription>Start generating a new issue for a teacher.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p>Go to the Scripts Issue Form page to get started with creating issue records.</p>
          </CardContent>
          <CardFooter>
            <Link href="/issue-form" passHref>
              <Button className="w-full">Go to Scripts Issue Form</Button>
            </Link>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              App Settings
            </CardTitle>
            <CardDescription>Configure your application and integrations.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p>Manage your account settings and connect to services like Google Drive for data synchronization.</p>
          </CardContent>
          <CardFooter>
            <Link href="/settings" passHref>
                <Button className="w-full">Go to Settings</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
