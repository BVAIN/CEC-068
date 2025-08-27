
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SIDEBAR_AWARDS_VISIBILITY_KEY } from "@/lib/constants";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export default function SettingsPage() {
    const { toast } = useToast();
    const { isConnected, isLoading, error, connect, disconnect } = useGoogleDrive();
    const [showAwardsDispatch, setShowAwardsDispatch] = useState(true);

    useEffect(() => {
        const storedVisibility = localStorage.getItem(SIDEBAR_AWARDS_VISIBILITY_KEY);
        if (storedVisibility) {
            setShowAwardsDispatch(JSON.parse(storedVisibility));
        }
    }, []);

    const handleAwardsVisibilityChange = (checked: boolean) => {
        setShowAwardsDispatch(checked);
        localStorage.setItem(SIDEBAR_AWARDS_VISIBILITY_KEY, JSON.stringify(checked));
        // This is a simple way to trigger a re-render of the sidebar.
        // In a more complex app, this might be handled by a global state manager.
        window.dispatchEvent(new Event('storage'));
    };

    const form = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    function onSubmit(values: z.infer<typeof passwordFormSchema>) {
        console.log(values);
        toast({
            title: "Password Changed",
            description: "Your password has been updated successfully.",
        });
        form.reset();
    }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Settings</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how your information will be displayed in the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value="cec-068" disabled />
          </div>
          <Button disabled>Update Profile</Button>
        </CardContent>
      </Card>
      
      <Card>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password here. Make sure to choose a strong one.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
                <CardFooter>
                <Button type="submit">Change Password</Button>
                </CardFooter>
            </form>
        </Form>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>UI Settings</CardTitle>
          <CardDescription>Customize the user interface.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base" htmlFor="awards-dispatch-visibility">Awards Dispatch Data</Label>
                    <p className="text-sm text-muted-foreground">
                        Show or hide the 'Awards Dispatch Data' button in the sidebar.
                    </p>
                </div>
                <Switch
                    id="awards-dispatch-visibility"
                    checked={showAwardsDispatch}
                    onCheckedChange={handleAwardsVisibilityChange}
                />
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Drive Integration</CardTitle>
          <CardDescription>Connect your Google Drive account to store and sync your data securely. This enables offline access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {isConnected ? (
              <Button onClick={disconnect} variant="destructive" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disconnect Google Drive
              </Button>
            ) : (
              <Button onClick={connect} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect to Google Drive
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              Status: <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-destructive-foreground/80'}`}>{isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Not connected'}</span>
            </p>
          </div>
           {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

    