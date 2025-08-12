"use client";

import { useTheme } from "@/contexts/theme-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemePage() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: "light", icon: <Sun className="w-8 h-8" /> },
    { name: "grey", icon: <Monitor className="w-8 h-8" /> },
    { name: "dark", icon: <Moon className="w-8 h-8" /> },
  ] as const;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Themes</h1>
        <p className="text-lg text-muted-foreground mt-2">Personalize the appearance of your application.</p>
      </header>
      
      <div className="grid md:grid-cols-3 gap-6">
        {themes.map((t) => (
          <ThemeCard
            key={t.name}
            title={t.name.charAt(0).toUpperCase() + t.name.slice(1)}
            icon={t.icon}
            isSelected={theme === t.name}
            onClick={() => setTheme(t.name)}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeCard({ title, icon, isSelected, onClick }: { title: string, icon: React.ReactNode, isSelected: boolean, onClick: () => void }) {
  return (
    <Card 
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200 transform hover:scale-105",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      onClick={onClick}
    >
      {icon}
      <p className="mt-4 font-semibold text-lg">{title}</p>
      {isSelected && <p className="text-sm text-primary font-medium mt-2">Current Theme</p>}
    </Card>
  )
}
