
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, ArrowLeft, Filter, Edit, Trash2, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { PUBLIC_ISSUES_STORAGE_KEY, INDEX_TRASH_STORAGE_KEY } from "@/lib/constants";
import type { PublicIssueFormValues } from "@/app/(public)/entry/page";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type FilterValues = Partial<Omit<PublicIssueFormValues, "id" | "asPerChallan" | "netScripts" | "difference">> & {
    asPerChallan: string;
    netScripts: string;
    difference: string;
};

type CampusStats = {
    regular: number,
    ncweb: number,
    sol: number,
    allData: number
}

export default function IndexPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [entries, setEntries] = useState<PublicIssueFormValues[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"North" | "South" | "Search" | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterValues>({} as FilterValues);

  useEffect(() => {
    const storedEntries = localStorage.getItem(PUBLIC_ISSUES_STORAGE_KEY);
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }
  }, []);

  useEffect(() => {
    // Clear selections when changing views
    setSelectedEntries([]);
  }, [activeView, searchTerm, filters]);
  
  useEffect(() => {
    if (searchTerm) {
        setActiveView("Search");
    } else {
        if(activeView === "Search") setActiveView(null);
    }
  }, [searchTerm]);

  const handleNavigation = (path: string) => {
    router.push(path);
  };
  
  const updateEntriesStateAndStorage = (newEntries: PublicIssueFormValues[]) => {
      setEntries(newEntries);
      localStorage.setItem(PUBLIC_ISSUES_STORAGE_KEY, JSON.stringify(newEntries));
  };

  const filteredEntries = useMemo(() => {
    let results = entries;
    
    // Global Search for 'Search' view
    if (activeView === "Search") {
        const lowercasedTerm = searchTerm.toLowerCase();
        if (lowercasedTerm) {
            results = results.filter(entry =>
                Object.values(entry).some(value => 
                    String(value).toLowerCase().includes(lowercasedTerm)
                )
            );
        }
    } else if (activeView) { // Filter for 'North' or 'South' view
        results = entries.filter(e => e.campus === activeView);
        
        results = results.filter(entry => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                const entryValue = entry[key as keyof PublicIssueFormValues];
                return String(entryValue).toLowerCase().includes(String(value).toLowerCase());
            });
        });
    }

    return results;
  }, [entries, searchTerm, filters, activeView]);
  
  const northEntries = useMemo(() => entries.filter(entry => entry.campus === 'North'), [entries]);
  const southEntries = useMemo(() => entries.filter(entry => entry.campus === 'South'), [entries]);
  
  const calculateTotals = (campusEntries: PublicIssueFormValues[]) => {
    const totalChallan = campusEntries.reduce((acc, entry) => acc + (entry.asPerChallan || 0), 0);
    const totalNetScripts = campusEntries.reduce((acc, entry) => acc + (entry.netScripts || 0), 0);
    const totalDifference = totalNetScripts - totalChallan;
    return { totalChallan, totalNetScripts, totalDifference };
  }

  const northTotals = useMemo(() => calculateTotals(filteredEntries.filter(e => e.campus === 'North')), [filteredEntries]);
  const southTotals = useMemo(() => calculateTotals(filteredEntries.filter(e => e.campus === 'South')), [filteredEntries]);
  const searchTotals = useMemo(() => calculateTotals(filteredEntries), [filteredEntries, activeView]);


  const calculateCampusStats = (campusEntries: PublicIssueFormValues[]): CampusStats => {
      const regular = campusEntries.filter(e => e.type === "Regular").reduce((acc, e) => acc + (e.netScripts || 0), 0);
      const ncweb = campusEntries.filter(e => e.type === "NCWEB").reduce((acc, e) => acc + (e.netScripts || 0), 0);
      const sol = campusEntries.filter(e => e.type === "SOL").reduce((acc, e) => acc + (e.netScripts || 0), 0);
      return { regular, ncweb, sol, allData: regular + ncweb + sol };
  }
  
  const northStats = useMemo(() => calculateCampusStats(northEntries), [northEntries]);
  const southStats = useMemo(() => calculateCampusStats(southEntries), [southEntries]);


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
      
      const storedTrash = localStorage.getItem(INDEX_TRASH_STORAGE_KEY);
      const trash = storedTrash ? JSON.parse(storedTrash) : [];
      localStorage.setItem(INDEX_TRASH_STORAGE_KEY, JSON.stringify([...trash, ...entriesToTrash]));
      
      updateEntriesStateAndStorage(remainingEntries);
      setSelectedEntries([]);
      toast({ title: "Entries Moved to Trash", description: `${ids.length} entries have been moved to the trash.`});
  };
  
  const handleFilterChange = (field: keyof FilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  
  const handleExport = (data: PublicIssueFormValues[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Entries");
    XLSX.writeFile(workbook, filename);
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
  
  const StatTile = ({ title, value }: { title: string, value: number }) => (
      <Card>
        <CardHeader>
            <CardTitle className="text-base text-center">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-2xl font-bold text-center">{value}</p>
        </CardContent>
      </Card>
  );

  const renderTable = (title: string, data: PublicIssueFormValues[], totals: {totalChallan: number, totalNetScripts: number, totalDifference: number}, stats?: CampusStats) => {
    const isAllSelected = data.length > 0 && selectedEntries.length === data.filter(e => data.map(d => d.id).includes(e.id)).length;
    
    return (
     <div className="mt-8 space-y-6">
        {stats && (
             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatTile title={`${title} Regular`} value={stats.regular} />
                <StatTile title={`${title} NCWEB`} value={stats.ncweb} />
                <StatTile title={`${title} SOL`} value={stats.sol} />
                <StatTile title={`${title} All Data`} value={stats.allData} />
            </div>
        )}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{title} Campus</CardTitle>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleNavigation('/entry')} className="bg-green-500 hover:bg-green-600 text-white">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Entry
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExport(data, `${title}_Entries.xlsx`)}>
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
                            <Button size="sm" className="bg-gradient-to-r from-green-400 to-yellow-400 text-black">
                                <Filter className="mr-2 h-4 w-4"/>
                                Filter
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Filters</h4>
                                    <p className="text-sm text-muted-foreground">Filter entries by the following criteria.</p>
                                </div>
                                <div className="grid gap-2">
                                    {filterFields.map(field => (
                                        <div key={field.name} className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                                            <Input
                                                id={`filter-${field.name}`}
                                                value={filters[field.name] || ''}
                                                onChange={(e) => handleFilterChange(field.name, e.target.value)}
                                                className="col-span-2 h-8"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-12">
                        <Checkbox
                            onCheckedChange={handleSelectAll(data)}
                            checked={isAllSelected}
                            aria-label="Select all"
                        />
                    </TableHead>
                    <TableHead>Date of Exam</TableHead>
                    <TableHead>UPC</TableHead>
                    <TableHead>QP No.</TableHead>
                    <TableHead>Page No.</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>As Per Challan</TableHead>
                    <TableHead>Net Scripts</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((entry) => (
                    <TableRow key={entry.id}>
                        <TableCell>
                            <Checkbox
                                onCheckedChange={(checked) => entry.id && handleSelectEntry(entry.id, !!checked)}
                                checked={!!entry.id && selectedEntries.includes(entry.id)}
                                aria-label={`Select entry ${entry.pageNo}`}
                                disabled={!entry.id}
                            />
                        </TableCell>
                        <TableCell>{entry.dateOfExam}</TableCell>
                        <TableCell>{entry.upc}</TableCell>
                        <TableCell>{entry.qpNo}</TableCell>
                        <TableCell>{entry.pageNo}</TableCell>
                        <TableCell>{entry.course}</TableCell>
                        <TableCell>{entry.asPerChallan}</TableCell>
                        <TableCell>{entry.netScripts}</TableCell>
                        <TableCell>{(entry.netScripts || 0) - (entry.asPerChallan || 0)}</TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleEdit(entry.id!)}>
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
                    <TableCell colSpan={6} className="text-right font-bold">Total</TableCell>
                    <TableCell className="font-bold">{totals.totalChallan}</TableCell>
                    <TableCell className="font-bold">{totals.totalNetScripts}</TableCell>
                    <TableCell className="font-bold">{totals.totalDifference}</TableCell>
                    <TableCell />
                    </TableRow>
                </TableFooter>
                </Table>
            </CardContent>
        </Card>
     </div>
  )};

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
              <p className="text-lg text-muted-foreground mt-2">Select a campus to view its forms.</p>
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
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => handleNavigation('/entry')}
            >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Entry
            </Button>
        </div>
      </header>
      
      {!activeView && (
        <div className="grid md:grid-cols-2 gap-8 pt-8">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-blue-500 text-white" onClick={() => setActiveView("North")}>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">North Campus</CardTitle>
                </CardHeader>
                 <CardFooter>
                     <div className="w-full text-center font-bold text-lg">
                        Total Scripts: {northStats.allData}
                    </div>
                </CardFooter>
            </Card>
             <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-red-500 text-white" onClick={() => setActiveView("South")}>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">South Campus</CardTitle>
                </CardHeader>
                 <CardFooter>
                     <div className="w-full text-center font-bold text-lg">
                        Total Scripts: {southStats.allData}
                    </div>
                </CardFooter>
            </Card>
        </div>
      )}

      {activeView === 'North' && renderTable("North", filteredEntries, northTotals, northStats)}
      {activeView === 'South' && renderTable("South", filteredEntries, southTotals, southStats)}
      {activeView === 'Search' && renderTable(`Search Results for "${searchTerm}"`, filteredEntries, searchTotals)}


    </div>
  );
}

    