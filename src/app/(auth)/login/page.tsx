
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 animate-fade-in bg-gradient-to-br from-primary/10 via-background to-secondary/10">
       <div className="w-full max-w-md mx-auto space-y-8">
            <header className="text-center">
                <h1 className="text-4xl font-bold tracking-tight font-headline">Welcome to CEC-068</h1>
                <p className="mt-3 text-lg text-muted-foreground">Please sign in to continue</p>
            </header>
            <LoginForm />
       </div>
    </main>
  );
}
