import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-center font-headline tracking-tight">DriveSync Notes</h1>
          <p className="text-muted-foreground mt-2">Please log in to access your account.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
