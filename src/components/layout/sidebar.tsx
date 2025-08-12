
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FilePlus, Settings, Rocket, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/issue-form", label: "Issue Form", icon: FilePlus },
  { href: "/bill-form", label: "Bill Form", icon: FileText },
  { href: "/trash", label: "Trash", icon: Trash2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  
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
                  isActive && 'text-primary-foreground'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
