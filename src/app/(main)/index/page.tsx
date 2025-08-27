
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, ArrowLeft, Filter, Edit, Trash2, FileDown, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getPublicIssuesStorageKey, getIndexTrashStorageKey } from "@/lib/constants";
import type { PublicIssueFormValues } from "@/app/(public)/entry/page";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogHeader, DialogFooter, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type FilterValues = Partial<Omit<PublicIssueFormValues, "id" | "asPerChallan" | "netScripts" | "difference" | "type" | "pageNo">> & {
    asPerChallan: string;
    netScripts: string;
    difference: string;
    pageNo: string;
    type: ("Regular" | "NCWEB" | "SOL")[];
};

type StatDetail = {
    asPerChallan: number;
    netScripts: number;
    difference: number;
    entryCount: number;
};

type CampusStats = {
    regular: StatDetail,
    ncweb: StatDetail,
    sol: StatDetail,
    allData: StatDetail,
};

const formatDate = (dateString: string) => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

export default function IndexPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [entries, setEntries] = useState<PublicIssueFormValues[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"North" | "South" | "Search" | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterValues>({ type: [] } as FilterValues);
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [currentRemarks, setCurrentRemarks] = useState<{ id: string; text?: string }>({ id: '' });
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [northEntriesCount, setNorthEntriesCount] = useState(0);
  const [southEntriesCount, setSouthEntriesCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (typeof window === 'undefined') return;
    try {
      const storedEntries = localStorage.getItem(getPublicIssuesStorageKey());
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        setEntries(parsedEntries);
        setNorthEntriesCount(parsedEntries.filter((e: PublicIssueFormValues) => e.campus === 'North').length);
        setSouthEntriesCount(parsedEntries.filter((e: PublicIssueFormValues) => e.campus === 'South').length);
      }
    } catch (error) {
        console.error("Error parsing localStorage data:", error);
    }
  }, []);

  useEffect(() => {
    // Clear selections and filters when changing views
    setSelectedEntries([]);
    setFilters({ type: [] } as FilterValues);
  }, [activeView]);
  
  useEffect(() => {
    if (searchTerm) {
        setActiveView("Search");
    } else {
        if(activeView === "Search") setActiveView(null);
    }
  }, [searchTerm, activeView]);

  const handleNavigation = (path: string) => {
    router.push(path);
  };
  
  const updateEntriesStateAndStorage = (newEntries: PublicIssueFormValues[]) => {
      setEntries(newEntries);
      localStorage.setItem(getPublicIssuesStorageKey(), JSON.stringify(newEntries));
      setNorthEntriesCount(newEntries.filter((e: PublicIssueFormValues) => e.campus === 'North').length);
      setSouthEntriesCount(newEntries.filter((e: PublicIssueFormValues) => e.campus === 'South').length);
  };

  const filteredEntries = useMemo(() => {
    let baseEntries: PublicIssueFormValues[];

    switch(activeView) {
        case 'North':
            baseEntries = entries.filter(e => e.campus === 'North')
                .sort((a, b) => (parseInt(a.pageNo || '0', 10)) - (parseInt(b.pageNo || '0', 10)));
            break;
        case 'South':
            baseEntries = entries.filter(e => e.campus === 'South')
                .sort((a, b) => (parseInt(a.pageNo || '0', 10)) - (parseInt(b.pageNo || '0', 10)));
            break;
        case 'Search':
            const lowercasedTerm = searchTerm.toLowerCase();
            baseEntries = lowercasedTerm ? entries.filter(entry =>
                Object.values(entry).some(value => 
                    String(value).toLowerCase().includes(lowercasedTerm)
                )
            ) : [];
            break;
        default:
            baseEntries = []; // Show nothing if no view is active
    }

    return baseEntries.filter(entry => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value || (Array.isArray(value) && value.length === 0)) return true;
          if (key === 'type' && Array.isArray(value)) {
              return value.includes(entry.type);
          }
          const entryValue = entry[key as keyof PublicIssueFormValues];
          return String(entryValue).toLowerCase().includes(String(value).toLowerCase());
        });
      });
  }, [entries, searchTerm, filters, activeView]);
  

  const calculateTotals = (campusEntries: PublicIssueFormValues[]) => {
    const totalChallan = campusEntries.reduce((acc, entry) => acc + (entry.asPerChallan || 0), 0);
    const totalNetScripts = campusEntries.reduce((acc, entry) => acc + (entry.netScripts || 0), 0);
    const totalDifference = totalNetScripts - totalChallan;
    return { totalChallan, totalNetScripts, totalDifference };
  }
  
  const getTotalsForView = () => {
      return calculateTotals(filteredEntries);
  }


  const calculateCampusStats = (campusEntries: PublicIssueFormValues[]): CampusStats => {
      const calculateStatsForType = (type: "Regular" | "NCWEB" | "SOL"): StatDetail => {
          const filtered = campusEntries.filter(e => e.type === type);
          const asPerChallan = filtered.reduce((acc, e) => acc + (e.asPerChallan || 0), 0);
          const netScripts = filtered.reduce((acc, e) => acc + (e.netScripts || 0), 0);
          const entryCount = filtered.length;
          return { asPerChallan, netScripts, difference: netScripts - asPerChallan, entryCount };
      };

      const regular = calculateStatsForType("Regular");
      const ncweb = calculateStatsForType("NCWEB");
      const sol = calculateStatsForType("SOL");
      
      const allData: StatDetail = {
          asPerChallan: regular.asPerChallan + ncweb.asPerChallan + sol.asPerChallan,
          netScripts: regular.netScripts + ncweb.netScripts + sol.netScripts,
          difference: regular.difference + ncweb.difference + sol.difference,
          entryCount: regular.entryCount + ncweb.entryCount + sol.entryCount
      };

      return { regular, ncweb, sol, allData };
  }
  
  const getStatsForView = () => calculateCampusStats(filteredEntries);


  const handleSelectEntry = (entryId: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries(prev => [...prev, entryId]);
    } else {
      setSelectedEntries(prev => prev.filter(id => id !== entryId));
    }
  };

  const handleSelectAll = (data: PublicIssueFormValues[]) => (checked: boolean) => {
    if (checked) {
        setSelectedEntries(data.map(entry => entry.id).filter((id): id is string => !!id));
    } else {
        setSelectedEntries([]);
    }
  };
  
  const handleEdit = (id: string) => {
      router.push(`/entry?edit=${id}`);
  };

  const handleDelete = (ids: string[]) => {
      const entriesToTrash = entries.filter(entry => ids.includes(entry.id!));
      const remainingEntries = entries.filter(entry => !ids.includes(entry.id!));
      
      const storedTrash = localStorage.getItem(getIndexTrashStorageKey());
      const trash = storedTrash ? JSON.parse(storedTrash) : [];
      localStorage.setItem(getIndexTrashStorageKey(), JSON.stringify([...trash, ...entriesToTrash]));
      
      updateEntriesStateAndStorage(remainingEntries);
      setSelectedEntries([]);
      toast({ title: "Entries Moved to Trash", description: `${ids.length} entries have been moved to the trash.`});
  };
  
  const handleFilterChange = (field: keyof FilterValues, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxFilterChange = (field: 'type', value: string, checked: boolean) => {
    setFilters(prev => {
        const currentValues = prev[field] as string[];
        if (checked) {
            return { ...prev, [field]: [...currentValues, value] };
        } else {
            return { ...prev, [field]: currentValues.filter(v => v !== value) };
        }
    });
  };
  
  const handleExport = (data: PublicIssueFormValues[], filename: string) => {
    const dataToExport = data.map(({id, ...rest}) => ({
        "Date of Exam": formatDate(rest.dateOfExam),
        "UPC": rest.upc,
        "QP No.": rest.qpNo,
        "Page No.": rest.pageNo,
        "Course": rest.course,
        "Type": rest.type,
        "Campus": rest.campus,
        "As Per Challan": rest.asPerChallan,
        "Net Scripts": rest.netScripts,
        "Difference": (rest.netScripts || 0) - (rest.asPerChallan || 0),
        "Remarks": rest.remarks,
    }));
     if (dataToExport.length === 0) {
        toast({ variant: 'destructive', title: 'No data to export' });
        return;
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    
    const headers = Object.keys(dataToExport[0]).map(header => {
        const capitalizedHeader = header.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return {
            v: capitalizedHeader,
            t: 's',
            s: { font: { bold: true } }
        };
    });
    
    XLSX.utils.sheet_add_aoa(worksheet, [headers.map(h => h.v)], { origin: 'A1' });
    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A2', skipHeader: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Entries");
    XLSX.writeFile(workbook, filename);
  };
  
  const handleOpenRemarks = (entry: PublicIssueFormValues) => {
      setCurrentRemarks({ id: entry.id!, text: entry.remarks || '' });
      setIsEditingRemarks(!entry.remarks);
      setRemarksModalOpen(true);
  };

  const handleSaveRemarks = () => {
    const newEntries = entries.map(entry => {
        if (entry.id === currentRemarks.id) {
            return { ...entry, remarks: currentRemarks.text };
        }
        return entry;
    });
    updateEntriesStateAndStorage(newEntries);
    setRemarksModalOpen(false);
    toast({ title: "Remarks Saved", description: "Your remarks have been updated." });
  };


  const filterFields: { name: keyof FilterValues, label: string }[] = [
      { name: 'dateOfExam', label: 'Date of Exam' },
      { name: 'upc', label: 'UPC' },
      { name: 'qpNo', label: 'QP No.' },
      { name: 'pageNo', label: 'Page No.' },
      { name: 'course', label: 'Course' },
      { name: 'asPerChallan', label: 'As Per Challan' },
      { name: 'netScripts', label: 'Net Scripts' },
      { name: 'difference', label: 'Difference' },
  ];

  const StatCard = ({ title, stats, className }: { title: string, stats: StatDetail, className?: string }) => (
    <Card className={cn("flex flex-col", className)}>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 flex-grow">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">As Per Challan:</span>
                <span className="font-medium">{stats.asPerChallan}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Scripts:</span>
                <span className="font-medium">{stats.netScripts}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
                <span className="text-muted-foreground">Difference:</span>
                <span className="font-medium">{stats.difference}</span>
            </div>
        </CardContent>
        <CardFooter className="justify-center">
            <div className="text-center text-xs text-muted-foreground">
              Entries: {stats.entryCount}
            </div>
        </CardFooter>
    </Card>
  );

  const renderTable = (title: string, data: PublicIssueFormValues[], totals: {totalChallan: number, totalNetScripts: number, totalDifference: number}, stats?: CampusStats) => {
    const isAllSelected = data.length > 0 && selectedEntries.length === data.filter(e => data.map(d => d.id).includes(e.id)).length;
    const isSearch = activeView === 'Search';

    return (
     <>
      <div className="mt-8 space-y-6">
        {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Regular" stats={stats.regular} />
                <StatCard title="NCWEB" stats={stats.ncweb} />
                <StatCard title="SOL" stats={stats.sol} />
                <StatCard title="All Data" stats={stats.allData} className="bg-primary/10" />
            </div>
        )}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{title}</CardTitle>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleNavigation('/entry')} className="bg-blue-500 hover:bg-blue-600 text-white">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Entry
                    </Button>
                    <Button size="sm" onClick={() => handleExport(data, `${title.replace(/"/g, '')}_Entries.xlsx`)} variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                        <FileDown className="mr-2 h-4 w-4" /> Export to Excel
                    </Button>
                    {selectedEntries.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Delete ({selectedEntries.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will move {selectedEntries.length} item(s) to the trash.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(selectedEntries)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white">
                                <Filter className="mr-2 h-4 w-4"/>
                                Filter
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Filters</h4>
                                </div>
                                <div className="grid gap-2">
                                    {filterFields.map(field => (
                                        <div key={field.name} className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                                            <Input
                                                id={`filter-${field.name}`}
                                                value={filters[field.name as keyof Omit<FilterValues, 'type'>] || ''}
                                                onChange={(e) => handleFilterChange(field.name, e.target.value)}
                                                className="col-span-2 h-8"
                                            />
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-3 items-start gap-4">
                                        <Label>Type</Label>
                                        <div className="col-span-2 flex flex-col gap-2">
                                            <div className="flex items-center space-x-2"><Checkbox id="filter-type-regular" checked={filters.type.includes('Regular')} onCheckedChange={(c) => handleCheckboxFilterChange('type', 'Regular', !!c)} /><Label htmlFor="filter-type-regular" className="font-normal">Regular</Label></div>
                                            <div className="flex items-center space-x-2"><Checkbox id="filter-type-ncweb" checked={filters.type.includes('NCWEB')} onCheckedChange={(c) => handleCheckboxFilterChange('type', 'NCWEB', !!c)} /><Label htmlFor="filter-type-ncweb" className="font-normal">NCWEB</Label></div>
                                            <div className="flex items-center space-x-2"><Checkbox id="filter-type-sol" checked={filters.type.includes('SOL')} onCheckedChange={(c) => handleCheckboxFilterChange('type', 'SOL', !!c)} /><Label htmlFor="filter-type-sol" className="font-normal">SOL</Label></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow className="bg-nav-index hover:bg-nav-index/90">
                    <TableHead className="w-12 text-primary-foreground">
                        <Checkbox
                            onCheckedChange={handleSelectAll(data)}
                            checked={isAllSelected}
                            aria-label="Select all"
                            className="border-primary-foreground text-primary-foreground"
                        />
                    </TableHead>
                    <TableHead className="text-primary-foreground">Date of Exam</TableHead>
                    {isSearch && <TableHead className="text-primary-foreground">Course</TableHead>}
                    {isSearch && <TableHead className="text-primary-foreground">Type</TableHead>}
                    <TableHead className="text-primary-foreground">UPC</TableHead>
                    <TableHead className="text-primary-foreground">QP No.</TableHead>
                    <TableHead className="text-primary-foreground">Page No.</TableHead>
                    {!isSearch && <TableHead className="text-primary-foreground">Course</TableHead>}
                    {!isSearch && <TableHead className="text-primary-foreground">Type</TableHead>}
                    <TableHead className="text-primary-foreground">As Per Challan</TableHead>
                    <TableHead className="text-primary-foreground">Net Scripts</TableHead>
                    <TableHead className="text-primary-foreground">Difference</TableHead>
                    <TableHead className="text-primary-foreground">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((entry, index) => (
                    <TableRow key={entry.id} className={cn(index % 2 === 0 ? "bg-muted/50" : "bg-background")}>
                        <TableCell>
                            <Checkbox
                                onCheckedChange={(checked) => entry.id && handleSelectEntry(entry.id, !!checked)}
                                checked={!!entry.id && selectedEntries.includes(entry.id)}
                                aria-label={`Select entry ${entry.pageNo}`}
                                disabled={!entry.id}
                            />
                        </TableCell>
                        <TableCell>{formatDate(entry.dateOfExam)}</TableCell>
                        {isSearch && <TableCell>{entry.course}</TableCell>}
                        {isSearch && <TableCell>{entry.type}</TableCell>}
                        <TableCell>{entry.upc}</TableCell>
                        <TableCell>{entry.qpNo}</TableCell>
                        <TableCell>{entry.pageNo}</TableCell>
                        {!isSearch && <TableCell>{entry.course}</TableCell>}
                        {!isSearch && <TableCell>{entry.type}</TableCell>}
                        <TableCell>{entry.asPerChallan}</TableCell>
                        <TableCell>{entry.netScripts}</TableCell>
                        <TableCell>{(entry.netScripts || 0) - (entry.asPerChallan || 0)}</TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                <Button variant="default" size="icon" onClick={() => handleOpenRemarks(entry)} className="bg-blue-500 hover:bg-blue-600 text-white">
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => handleEdit(entry.id!)} style={{backgroundColor: 'green', color: 'white'}}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will move the entry to the trash.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete([entry.id!])}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                    <TableCell colSpan={isSearch ? 5 : 7} className="text-right font-bold">Total</TableCell>
                    <TableCell className="font-bold">{totals.totalChallan}</TableCell>
                    <TableCell className="font-bold">{totals.totalNetScripts}</TableCell>
                    <TableCell className="font-bold">{totals.totalDifference}</TableCell>
                    <TableCell colSpan={2} />
                    </TableRow>
                </TableFooter>
                </Table>
            </CardContent>
        </Card>
        </div>
     </>
  )};

  if (!hydrated) {
    return null; // or a loading skeleton
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            {(activeView) && (
                <Button variant="outline" size="icon" onClick={() => { setActiveView(null); setSearchTerm(''); }}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            )}
            <div>
              <h1 className="text-4xl font-bold tracking-tight font-headline">Index</h1>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search all entries..." 
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => handleNavigation('/entry')}
            >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Entry
            </Button>
        </div>
      </header>
      
      {!activeView && (
        <div className="grid md:grid-cols-2 gap-8 pt-8">
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-95 bg-blue-500/80 text-white flex flex-col justify-between hover:scale-105" onClick={() => setActiveView("North")}>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-primary-foreground">North Campus</CardTitle>
                </CardHeader>
                <CardFooter>
                    <span className="text-xs text-center w-full text-primary-foreground/80">Entries: {northEntriesCount}</span>
                </CardFooter>
            </Card>
             <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-95 bg-red-500/80 text-white flex flex-col justify-between hover:scale-105" onClick={() => setActiveView("South")}>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-primary-foreground">South Campus</CardTitle>
                </CardHeader>
                <CardFooter>
                    <span className="text-xs text-center w-full text-primary-foreground/80">Entries: {southEntriesCount}</span>
                </CardFooter>
            </Card>
        </div>
      )}

      {activeView === 'North' && renderTable("North Campus", filteredEntries, getTotalsForView(), getStatsForView())}
      {activeView === 'South' && renderTable("South Campus", filteredEntries, getTotalsForView(), getStatsForView())}
      {activeView === 'Search' && renderTable(`Search Results for "${searchTerm}"`, filteredEntries, getTotalsForView())}

       <Dialog open={remarksModalOpen} onOpenChange={setRemarksModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Remarks</DialogTitle>
                <DialogDescription>
                    {isEditingRemarks ? "Add or edit remarks for this entry." : "Viewing remarks for this entry."}
                </DialogDescription>
            </DialogHeader>
            <Textarea
                value={currentRemarks.text}
                onChange={(e) => setCurrentRemarks(prev => ({ ...prev, text: e.target.value }))}
                readOnly={!isEditingRemarks}
                rows={6}
            />
            <DialogFooter>
                {!isEditingRemarks ? (
                    <Button type="button" onClick={() => setIsEditingRemarks(true)}>Edit</Button>
                ) : (
                    <Button type="button" onClick={handleSaveRemarks}>Save</Button>
                )}
                <Button type="button" variant="outline" onClick={() => setRemarksModalOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
