
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { Loader2, BellOff, Bell, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import * as XLSX from "xlsx";
import { 
    SIDEBAR_AWARDS_VISIBILITY_KEY,
    SIDEBAR_INDEX_VISIBILITY_KEY,
    SIDEBAR_ISSUE_VISIBILITY_KEY,
    SIDEBAR_BILL_VISIBILITY_KEY,
    SIDEBAR_TEACHERS_VISIBILITY_KEY,
    TOAST_SETTINGS_KEY,
    getPublicIssuesStorageKey,
    getIssuesStorageKey,
    getBillsStorageKey,
} from "@/lib/constants";
import type { PublicIssueFormValues } from "@/app/(public)/entry/page";
import type { IssueFormValues } from "../issue-form/page";
import type { BillFormValues } from "../bill-form/page";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type VisibilitySwitchProps = {
    id: string;
    label: string;
    description: string;
    storageKey: string;
}

type ToastSettings = {
    enabled: boolean;
    duration: number;
}

const formatDate = (dateString: string) => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

const VisibilitySwitch = ({ id, label, description, storageKey }: VisibilitySwitchProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const storedVisibility = localStorage.getItem(storageKey);
        // Default to true if the key doesn't exist
        if (storedVisibility) {
            setIsVisible(JSON.parse(storedVisibility));
        }
    }, [storageKey]);

    const handleVisibilityChange = (checked: boolean) => {
        setIsVisible(checked);
        localStorage.setItem(storageKey, JSON.stringify(checked));
        // Dispatch a storage event to notify the sidebar to re-render
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label className="text-base" htmlFor={id}>{label}</Label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch
                id={id}
                checked={isVisible}
                onCheckedChange={handleVisibilityChange}
            />
        </div>
    );
};


export default function SettingsPage() {
    const { toast } = useToast();
    const { isConnected, isLoading, error, connect, disconnect } = useGoogleDrive();
    const [toastSettings, setToastSettings] = useState<ToastSettings>({ enabled: true, duration: 1000 });

    useEffect(() => {
        const storedSettings = localStorage.getItem(TOAST_SETTINGS_KEY);
        if (storedSettings) {
            setToastSettings(JSON.parse(storedSettings));
        }
    }, []);

    const handleToastSettingsChange = (newSettings: Partial<ToastSettings>) => {
        const updatedSettings = { ...toastSettings, ...newSettings };
        setToastSettings(updatedSettings);
        localStorage.setItem(TOAST_SETTINGS_KEY, JSON.stringify(updatedSettings));
    };

    const form = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    function onSubmit(values: z.infer<typeof passwordFormSchema>) {
        console.log(values);
        toast({
            title: "Password Changed",
            description: "Your password has been updated successfully.",
        });
        form.reset();
    }
    
    const handleDownloadAllData = () => {
        const workbook = XLSX.utils.book_new();

        // 1. Index Data
        const indexDataRaw = localStorage.getItem(getPublicIssuesStorageKey());
        if (indexDataRaw) {
            const indexData: PublicIssueFormValues[] = JSON.parse(indexDataRaw);
            const formattedIndexData = indexData.map(d => ({
                "Date of Exam": formatDate(d.dateOfExam),
                "UPC": d.upc,
                "QP No.": d.qpNo,
                "Page No.": d.pageNo,
                "Course": d.course,
                "Type": d.type,
                "Campus": d.campus,
                "As Per Challan": d.asPerChallan,
                "Net Scripts": d.netScripts,
                "Difference": (d.netScripts || 0) - (d.asPerChallan || 0),
                "Remarks": d.remarks,
            }));
            const indexWorksheet = XLSX.utils.json_to_sheet(formattedIndexData);
            XLSX.utils.book_append_sheet(workbook, indexWorksheet, "Index Data");
        }

        // 2. Issue Packets Data
        const issuesDataRaw = localStorage.getItem(getIssuesStorageKey());
        if (issuesDataRaw) {
            const issuesData: IssueFormValues[] = JSON.parse(issuesDataRaw);
            const formattedIssuesData = issuesData.map(d => ({
                "Date of Issue": formatDate(d.dateOfIssue),
                "Packet No.": d.packetNo,
                "Range": `${d.packetFrom} - ${d.packetTo}`,
                "No. of Scripts": d.noOfScripts,
                "QP No.": d.qpNo,
                "UPC": d.upc,
                "Teacher Name": d.teacherName,
                "Teacher ID": d.teacherId,
                "Course": d.course,
                "Campus": d.campus,
                "Type": d.schoolType,
            }));
            const issuesWorksheet = XLSX.utils.json_to_sheet(formattedIssuesData);
            XLSX.utils.book_append_sheet(workbook, issuesWorksheet, "Issued Packets");
        }

        // 3. Bills Data
        const billsDataRaw = localStorage.getItem(getBillsStorageKey());
        if (billsDataRaw) {
            const billsData: BillFormValues[] = JSON.parse(billsDataRaw);
            const formattedBillsData = billsData.map(d => ({
                "Evaluator ID": d.evaluatorId,
                "Evaluator Name": d.evaluatorName,
                "College Name": d.collegeName,
                "Course": d.course,
                "Email": d.email,
                "Mobile No.": d.mobileNo,
                "PAN No.": d.panNo,
                "Address": d.address,
                "Distance (Km)": d.distance,
                "Bank Name": d.bankName,
                "Branch": d.branch,
                "Bank Account No.": d.bankAccountNo,
                "IFSC Code": d.ifscCode,
            }));
            const billsWorksheet = XLSX.utils.json_to_sheet(formattedBillsData);
            XLSX.utils.book_append_sheet(workbook, billsWorksheet, "Bill Forms");
        }
        
        // 4. Teacher Data
        if (billsDataRaw) { // Teachers are derived from bills
             const billsData: BillFormValues[] = JSON.parse(billsDataRaw);
             const uniqueTeachers = new Map();
             billsData.forEach(bill => {
                 if (!uniqueTeachers.has(bill.evaluatorId)) {
                     const { id, signature, ...teacherData } = bill;
                     uniqueTeachers.set(bill.evaluatorId, teacherData);
                 }
             });
             const teachersData = Array.from(uniqueTeachers.values());
             const formattedTeachersData = teachersData.map(d => ({
                "Evaluator ID": d.evaluatorId,
                "Evaluator Name": d.evaluatorName,
                "College Name": d.collegeName,
                "Course": d.course,
                "Email": d.email,
             }));
             const teachersWorksheet = XLSX.utils.json_to_sheet(formattedTeachersData);
             XLSX.utils.book_append_sheet(workbook, teachersWorksheet, "Teachers Data");
        }
        
        if (workbook.SheetNames.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Data to Export',
                description: 'There is no data in the application to download.',
            });
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `CEC068_Complete_Backup_${today}.xlsx`);
    };

    const handleGenerateSampleCSV = () => {
        const headers = "Data Type,ID,Date,Course,UPC,Scripts,Campus,Teacher Name,Teacher ID\n";
        let csvContent = headers;

        const courses = ["B.Com (H)", "Pol Sc (H)", "History (H)", "B.A. (Prog)", "B.Sc Physics"];
        const campuses = ["North", "South"];
        const names = ["Amit Kumar", "Sunita Sharma", "Rajesh Verma", "Priya Singh", "Deepak Gupta"];
        const colleges = ["KMC", "Hansraj", "Hindu", "Ramjas", "LSR"];

        for (let i = 1; i <= 2000; i++) {
            const typeIndex = Math.floor(Math.random() * 3);
            const dataType = ["Index", "Issue", "Bill"][typeIndex];
            const id = `${dataType.toLowerCase()}_${i}`;
            const date = `2024-07-${(Math.floor(Math.random() * 30) + 1).toString().padStart(2, '0')}`;
            const course = courses[Math.floor(Math.random() * courses.length)];
            const upc = `UPC${10000 + i}`;
            const scripts = Math.floor(Math.random() * 50) + 10;
            const campus = campuses[Math.floor(Math.random() * campuses.length)];
            const teacherName = names[Math.floor(Math.random() * names.length)];
            const teacherId = `T${2000 + i}`;
            
            csvContent += `"${dataType}","${id}","${date}","${course}","${upc}",${scripts},"${campus}","${teacherName}","${teacherId}"\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "sample_cec_data_2000.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Sample File Generated",
            description: "A CSV file with 2000 rows has been downloaded."
        });
    };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight font-headline">Settings</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how your information will be displayed in the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value="cec-068" disabled />
          </div>
          <Button disabled>Update Profile</Button>
        </CardContent>
      </Card>
      
      <Card>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password here. Make sure to choose a strong one.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
                <CardFooter>
                <Button type="submit">Change Password</Button>
                </CardFooter>
            </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Customize how notifications appear in the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base" htmlFor="notifications-enabled">Show Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable all pop-up notifications.</p>
                </div>
                <Switch
                    id="notifications-enabled"
                    checked={toastSettings.enabled}
                    onCheckedChange={(checked) => handleToastSettingsChange({ enabled: checked })}
                />
            </div>
            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex justify-between items-center">
                     <div className="space-y-0.5">
                        <Label className="text-base" htmlFor="notifications-duration">Auto-Dismiss Duration</Label>
                        <p className="text-sm text-muted-foreground">Set how long notifications stay on screen.</p>
                    </div>
                    <span className="font-mono text-lg">{toastSettings.duration / 1000}s</span>
                </div>
                <Slider
                    id="notifications-duration"
                    min={1000}
                    max={10000}
                    step={500}
                    value={[toastSettings.duration]}
                    onValueChange={(value) => handleToastSettingsChange({ duration: value[0] })}
                    disabled={!toastSettings.enabled}
                />
            </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>UI Settings</CardTitle>
          <CardDescription>Customize the sidebar navigation items.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <VisibilitySwitch 
                id="index-visibility"
                label="Index"
                description="Show or hide the 'Index' button in the sidebar."
                storageKey={SIDEBAR_INDEX_VISIBILITY_KEY}
            />
            <VisibilitySwitch 
                id="issue-packets-visibility"
                label="Issue Packets"
                description="Show or hide the 'Issue Packets' button in the sidebar."
                storageKey={SIDEBAR_ISSUE_VISIBILITY_KEY}
            />
            <VisibilitySwitch 
                id="bill-forms-visibility"
                label="Bill Forms"
                description="Show or hide the 'Bill Forms' button in the sidebar."
                storageKey={SIDEBAR_BILL_VISIBILITY_KEY}
            />
             <VisibilitySwitch 
                id="teachers-data-visibility"
                label="Teachers Data"
                description="Show or hide the 'Teachers Data' button in the sidebar."
                storageKey={SIDEBAR_TEACHERS_VISIBILITY_KEY}
            />
            <VisibilitySwitch 
                id="awards-dispatch-visibility"
                label="Awards Dispatch Data"
                description="Show or hide the 'Awards Dispatch Data' button in the sidebar."
                storageKey={SIDEBAR_AWARDS_VISIBILITY_KEY}
            />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export all your application data into a single file for backup or external use.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
            <Button onClick={handleDownloadAllData}>
                <Download className="mr-2 h-4 w-4" />
                Download All Data (XLSX)
            </Button>
            <Button onClick={handleGenerateSampleCSV} variant="secondary">
                <Download className="mr-2 h-4 w-4" />
                Download Sample CSV (2000 Rows)
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Drive Integration</CardTitle>
          <CardDescription>Connect your Google Drive account to store and sync your data securely. This enables offline access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {isConnected ? (
              <Button onClick={disconnect} variant="destructive" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disconnect Google Drive
              </Button>
            ) : (
              <Button onClick={connect} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect to Google Drive
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              Status: <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-destructive-foreground/80'}`}>{isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Not connected'}</span>
            </p>
          </div>
           {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
