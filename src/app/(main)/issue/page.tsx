import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function IssuePage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Report an Issue</h1>
        <p className="text-lg text-muted-foreground mt-2">We appreciate your feedback to help us improve.</p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Issue Submission Form</CardTitle>
          <CardDescription>Please describe the issue you are facing in detail. Include steps to reproduce if possible.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="issue_description">Description</Label>
            <Textarea placeholder="Describe the issue here..." id="issue_description" rows={10} />
          </div>
          <Button>Submit Issue</Button>
        </CardContent>
      </Card>
    </div>
  );
}
