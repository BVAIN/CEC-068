
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { Home, FilePlus, Settings, Rocket, Trash2, FileText, Sun, Moon, Laptop, FileArchive, List, Users, Info, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/theme-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
    SIDEBAR_AWARDS_VISIBILITY_KEY,
    SIDEBAR_INDEX_VISIBILITY_KEY,
    SIDEBAR_ISSUE_VISIBILITY_KEY,
    SIDEBAR_BILL_VISIBILITY_KEY,
    SIDEBAR_TEACHERS_VISIBILITY_KEY,
    CURRENT_SESSION_KEY,
    SESSIONS_STORAGE_KEY
} from "@/lib/constants";

type Session = {
  id: string;
  name: string;
};

const allMenuItems = [
  { href: "/home", label: "Home", icon: Home, colorClass: "bg-nav-home", storageKey: null },
  { href: "/index", label: "Index", icon: List, colorClass: "bg-nav-index", storageKey: SIDEBAR_INDEX_VISIBILITY_KEY },
  { href: "/issue-form", label: "Issue Packets", icon: FilePlus, colorClass: "bg-nav-issue", storageKey: SIDEBAR_ISSUE_VISIBILITY_KEY },
  { href: "/bill-form", label: "Bill Forms", icon: FileText, colorClass: "bg-nav-bill", storageKey: SIDEBAR_BILL_VISIBILITY_KEY },
  { href: "/teachers", label: "Teachers Data", icon: Users, colorClass: "bg-nav-teachers", storageKey: SIDEBAR_TEACHERS_VISIBILITY_KEY },
  { href: "/awards-dispatch", label: "Awards Dispatch Data", icon: Award, colorClass: "bg-nav-awards", storageKey: SIDEBAR_AWARDS_VISIBILITY_KEY },
  { 
      href: "/trash", 
      label: "Trash", 
      icon: Trash2,
      colorClass: "bg-nav-trash",
      storageKey: null,
      subItems: [
        { href: "/trash/sessions", label: "Session Trash", icon: Trash2 },
        { href: "/trash/index", label: "Index Trash", icon: Trash2 },
        { href: "/trash/issues", label: "Issue Trash", icon: Trash2 },
        { href: "/trash/bills", label: "Bill Trash", icon: FileArchive },
        { href: "/trash/teachers", label: "Teacher Trash", icon: Users },
      ] 
  },
  { href: "/settings", label: "Settings", icon: Settings, colorClass: "bg-nav-settings", storageKey: null },
];

const secondaryMenuItems = [
    { href: "/about", label: "About", icon: Info, colorClass: "bg-nav-about" }
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [visibleItems, setVisibleItems] = useState(allMenuItems);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const updateVisibleItems = () => {
        const filteredItems = allMenuItems.filter(item => {
            if (!item.storageKey) return true;
            const isVisible = JSON.parse(localStorage.getItem(item.storageKey) ?? 'true');
            return isVisible;
        });
        setVisibleItems(filteredItems);
    };

    const loadSessionInfo = () => {
        const currentSessionId = localStorage.getItem(CURRENT_SESSION_KEY);
        setHasSession(!!currentSessionId);
        if (currentSessionId) {
            const sessionsData = localStorage.getItem(SESSIONS_STORAGE_KEY);
            if (sessionsData) {
                const sessions: Session[] = JSON.parse(sessionsData);
                const currentSession = sessions.find(s => s.id === currentSessionId);
                setSessionName(currentSession?.name || null);
            }
        } else {
          setSessionName(null);
        }
    };
    
    updateVisibleItems();
    loadSessionInfo();

    const handleStorageChange = () => {
      updateVisibleItems();
      loadSessionInfo();
    }

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname, searchParams]); // Re-run on searchParams change as well for session switch

  const handleLinkClick = useCallback((e: React.MouseEvent, href: string) => {
    const isSessionActive = !!localStorage.getItem(CURRENT_SESSION_KEY);
    const isAllowedPath = ['/sessions', '/settings', '/about'].some(p => href.startsWith(p));
    
    if (!isSessionActive && !isAllowedPath) {
      e.preventDefault();
      toast({
        variant: 'destructive',
        title: "No Session Selected",
        description: "Please select a session before proceeding."
      });
    }
  }, [toast]);
  
  return (
    <aside className="w-64 bg-card text-card-foreground flex-shrink-0 flex-col border-r hidden md:flex">
      <Link href="/sessions" className="block p-4 border-b hover:bg-accent cursor-pointer transition-colors">
        <div className="flex items-center gap-3">
          <Rocket className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold font-headline">CEC-068</h1>
             {pathname === '/sessions' ? (
                <p className="text-xs text-muted-foreground font-medium">Select Session</p>
             ) : (
                sessionName ? <p className="text-xs text-muted-foreground font-medium truncate" title={sessionName}>{sessionName}</p> : <p className="text-xs text-muted-foreground font-medium">No Session</p>
             )}
          </div>
        </div>
      </Link>
      <nav className="flex-1 p-4 space-y-2 flex flex-col justify-between">
        <div className="space-y-2">
            {visibleItems.map((item) => {
             const isActive = item.subItems 
                ? item.subItems.some(sub => pathname.startsWith(sub.href))
                : pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));

              const activeClasses = isActive 
                ? `${item.colorClass} text-primary-foreground hover:${item.colorClass}/90`
                : "ghost";

              if (item.subItems) {
                return (
                   <DropdownMenu key={item.href}>
                    <DropdownMenuTrigger asChild>
                       <Button
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            'w-full justify-start text-base py-6',
                            isActive && activeClasses
                          )}
                           onClick={(e) => {
                            if (!hasSession && !['/settings', '/about'].some(p => item.href.startsWith(p))) {
                              e.preventDefault();
                               toast({
                                variant: 'destructive',
                                title: "No Session Selected",
                                description: "Please select a session before proceeding."
                              });
                            }
                          }}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          <span>{item.label}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {item.subItems.map(subItem => (
                         <DropdownMenuItem key={subItem.href} asChild>
                            <Link href={subItem.href} onClick={(e) => handleLinkClick(e, subItem.href)}>
                              <subItem.icon className="mr-2 h-4 w-4" />
                              <span>{subItem.label}</span>
                            </Link>
                         </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
              
              return (
                <Button key={item.href} asChild variant={isActive ? "default" : "ghost"} className={cn('w-full justify-start text-base py-6', isActive && activeClasses)}>
                    <Link href={item.href} onClick={(e) => handleLinkClick(e, item.href)}>
                        <item.icon className="mr-3 h-5 w-5" />
                        <span>{item.label}</span>
                    </Link>
                </Button>
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
             {secondaryMenuItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const activeClasses = isActive ? `${item.colorClass} text-primary-foreground hover:${item.colorClass}/90` : "ghost";
                return (
                     <Button key={item.href} asChild variant={isActive ? "default" : "ghost"} className={cn('w-full justify-start text-base py-6', isActive && activeClasses)}>
                        <Link href={item.href} onClick={(e) => handleLinkClick(e, item.href)}>
                            <item.icon className="mr-3 h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    </Button>
                );
             })}
        </div>
      </nav>
    </aside>
  );
}
