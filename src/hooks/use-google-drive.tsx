
"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "./use-toast";

type DriveFile = {
  id: string;
  name: string;
  content: string; 
};

// This is a more advanced placeholder hook. It simulates file operations
// using localStorage to better mimic real-world Google Drive interactions.

const DRIVE_TOKEN_KEY = "google_drive_token_placeholder";
const DRIVE_STORAGE_KEY = "google_drive_files_placeholder";

export function useGoogleDrive() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);

  const syncFilesFromStorage = () => {
    const storedFiles = localStorage.getItem(DRIVE_STORAGE_KEY);
    if (storedFiles) {
      setFiles(JSON.parse(storedFiles));
    } else {
      setFiles([]);
    }
  };

  // Check connection status and load files on mount
  useEffect(() => {
    setIsLoading(true);
    const storedToken = localStorage.getItem(DRIVE_TOKEN_KEY);
    if (storedToken) {
      setIsConnected(true);
      syncFilesFromStorage();
    }
    setIsLoading(false);
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      const fakeToken = "fake_google_drive_token_" + Math.random();
      localStorage.setItem(DRIVE_TOKEN_KEY, fakeToken);
      setIsConnected(true);
      syncFilesFromStorage();
      toast({ title: "Connected", description: "Successfully connected to Google Drive." });
    } catch (e) {
      console.error("Failed to connect to Google Drive", e);
      setError("Failed to connect. Please try again.");
      toast({ variant: "destructive", title: "Connection Error", description: "Could not connect to Google Drive." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call to revoke token
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.removeItem(DRIVE_TOKEN_KEY);
      setIsConnected(false);
      setFiles([]); // Clear files on disconnect
      toast({ title: "Disconnected", description: "Successfully disconnected from Google Drive." });
    } catch (e) {
      console.error("Failed to disconnect from Google Drive", e);
      setError("Failed to disconnect. Please try again.");
       toast({ variant: "destructive", title: "Disconnection Error", description: "Could not disconnect from Google Drive." });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  const readFile = useCallback(async (fileName: string): Promise<string | null> => {
    if (!isConnected) {
        setError("Not connected to Google Drive.");
        return null;
    }
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network latency
    const file = files.find(f => f.name === fileName);
    return file ? file.content : null;
  }, [isConnected, files]);

  const writeFile = useCallback(async (fileName: string, content: string): Promise<void> => {
    if (!isConnected) {
        setError("Not connected to Google Drive.");
        throw new Error("Not connected to Google Drive.");
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency
    const updatedFiles = [...files];
    const fileIndex = updatedFiles.findIndex(f => f.name === fileName);
    
    if (fileIndex > -1) {
        updatedFiles[fileIndex].content = content;
    } else {
        updatedFiles.push({ id: `file_${Date.now()}`, name: fileName, content });
    }

    setFiles(updatedFiles);
    localStorage.setItem(DRIVE_STORAGE_KEY, JSON.stringify(updatedFiles));
    console.log(`File '${fileName}' saved to mock Google Drive.`);
  }, [isConnected, files]);


  return { isConnected, isLoading, error, files, connect, disconnect, readFile, writeFile };
}

    