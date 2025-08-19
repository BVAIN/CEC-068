
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FilePlus, Settings, Rocket, Trash2, FileText, Sun, Moon, Laptop, FileArchive, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/theme-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const menuItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/index", label: "Index", icon: List },
  { href: "/issue-form", label: "Issue Packets", icon: FilePlus },
  { href: "/bill-form", label: "Bill Form", icon: FileText },
  { 
      href: "/trash", 
      label: "Trash", 
      icon: Trash2,
      subItems: [
        { href: "/trash/index", label: "Index Trash", icon: Trash2 },
        { href: "/trash/issues", label: "Issue Trash", icon: Trash2 },
        { href: "/trash/bills", label: "Bill Trash", icon: FileArchive },
      ] 
  },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  
  return (
    <aside className="w-64 bg-card text-card-foreground flex-shrink-0 flex-col border-r hidden md:flex">
      <div className="p-4 border-b flex items-center gap-3">
        <Rocket className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold font-headline">CEC-068</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 flex flex-col justify-between">
        <div className="space-y-2">
            {menuItems.map((item) => {
             const isActive = item.subItems 
                ? item.subItems.some(sub => pathname.startsWith(sub.href))
                : pathname.startsWith(item.href);

              if (item.subItems) {
                return (
                   <DropdownMenu key={item.href}>
                    <DropdownMenuTrigger asChild>
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
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {item.subItems.map(subItem => (
                         <Link key={subItem.href} href={subItem.href} passHref>
                          <DropdownMenuItem>
                            <subItem.icon className="mr-2 h-4 w-4" />
                            <span>{subItem.label}</span>
                          </DropdownMenuItem>
                         </Link>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
              
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
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-base py-6">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="ml-3">Theme</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Laptop className="mr-2 h-4 w-4" />
                    <span>System</span>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </nav>
    </aside>
  );
}
