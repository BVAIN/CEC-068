"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, FilePlus, Palette, Settings, LogOut, Rocket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-provider";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/issue-form", label: "Issue Form", icon: FilePlus },
  { href: "/trash", label: "Trash", icon: Trash2 },
  { href: "/theme", label: "Theme", icon: Palette },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();

  const handleLogout = () => {
    // In a real app, clear auth token from storage
    router.push("/");
  };
  
  const getButtonGradientClass = () => {
    switch (theme) {
      case 'light': return 'bg-gradient-to-r from-primary to-blue-400 text-primary-foreground shadow-lg';
      case 'grey': return 'bg-gradient-to-r from-primary to-green-400 text-primary-foreground shadow-lg';
      case 'dark': return 'bg-gradient-to-r from-primary to-yellow-400 text-primary-foreground shadow-lg';
      default: return 'bg-gradient-to-r from-primary text-primary-foreground shadow-lg';
    }
  }

  return (
    <aside className="w-64 bg-card text-card-foreground flex-shrink-0 flex-col border-r hidden md:flex">
      <div className="p-4 border-b flex items-center gap-3">
        <Rocket className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold font-headline">CEC-068</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  'w-full justify-start text-base py-6',
                  isActive && getButtonGradientClass()
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start text-base py-6" onClick={handleLogout}>
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
