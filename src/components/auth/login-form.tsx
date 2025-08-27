
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
    securityAnswer: z.string().min(1, "Answer is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
        securityAnswer: "",
        newPassword: "",
        confirmPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (values.username === "cec-068" && values.password === "Khalsa@123") {
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting...",
        });
        router.push("/sessions");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid username or password.",
        });
      }
      setIsLoading(false);
    }, 1000);
  }
  
  function onForgotPasswordSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    if (values.securityAnswer.toLowerCase() === "prabhjeet singh") {
        // In a real app, you would now call an API to update the password.
        // For this demo, we'll just show a success message.
        toast({
            title: "Password Reset Successful",
            description: "You can now log in with your new password (demo: use original).",
        });
        setIsForgotPasswordOpen(false);
        forgotPasswordForm.reset();
    } else {
        forgotPasswordForm.setError("securityAnswer", {
            type: "manual",
            message: "The answer to the security question is incorrect."
        });
        toast({
            variant: "destructive",
            title: "Incorrect Answer",
            description: "The answer to the security question is incorrect.",
        });
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            {/* Intentionally empty to provide spacing */}
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                   <div className="flex justify-between items-center">
                        <FormLabel>Password</FormLabel>
                        <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="link" className="p-0 h-auto text-xs">Forgot Password?</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <Form {...forgotPasswordForm}>
                                    <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
                                        <DialogHeader>
                                            <DialogTitle>Forgot Password</DialogTitle>
                                            <DialogDescription>
                                                Answer the security question to reset your password.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <FormField
                                                control={forgotPasswordForm.control}
                                                name="securityAnswer"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        
                                                        <FormControl>
                                                            <Input placeholder="Who Created This Web Application?" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={forgotPasswordForm.control}
                                                name="newPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        
                                                        <FormControl>
                                                            <Input type="password" placeholder="New Password" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={forgotPasswordForm.control}
                                                name="confirmPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Confirm New Password</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" placeholder="" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsForgotPasswordOpen(false)}>Cancel</Button>
                                            <Button type="submit">Reset Password</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                   </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder=""
                        {...field}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
