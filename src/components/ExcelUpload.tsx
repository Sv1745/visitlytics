
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc } from 'firebase/firestore';

interface CompanyData {
  name: string;
  type: string;
  address?: string;
  phone?: string;
}

export const ExcelUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CompanyData[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const parseCSV = (text: string): CompanyData[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('company name');
    const typeIdx = headers.indexOf('company type');
    const addressIdx = headers.indexOf('address');
    const phoneIdx = headers.indexOf('phone');
    if (nameIdx === -1 || typeIdx === -1) return [];
    return lines.slice(1).map(line => {
      const cols = line.split(',');
      return {
        name: cols[nameIdx]?.trim() || '',
        type: cols[typeIdx]?.trim() || '',
        address: addressIdx !== -1 ? cols[addressIdx]?.trim() : undefined,
        phone: phoneIdx !== -1 ? cols[phoneIdx]?.trim() : undefined,
      };
    }).filter(c => c.name && c.type);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview([]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }
    if (!isAuthenticated || !user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to upload companies.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const text = await file.text();
      let companies: CompanyData[] = [];
      if (file.name.endsWith('.csv')) {
        companies = parseCSV(text);
      } else {
        toast({
          title: "Excel files not supported",
          description: "Please convert your Excel file to CSV format and try again",
          variant: "destructive",
        });
        return;
      }
      if (companies.length === 0) {
        toast({
          title: "No valid data found",
          description: "Please ensure your CSV has columns: Company Name, Company Type, Address (optional), Phone (optional)",
          variant: "destructive",
        });
        return;
      }
      // Insert companies with user_id
      for (const company of companies) {
        await addDoc(collection(db, 'companies'), {
          ...company,
          user_id: user.uid,
          created_at: new Date().toISOString(),
        });
      }
      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${companies.length} companies`,
      });
      setFile(null);
      setPreview([]);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload companies",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Companies (CSV)</CardTitle>
        <CardDescription>Upload a CSV file with columns: Company Name, Company Type, Address (optional), Phone (optional)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions Panel */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV Format Instructions
          </h4>
          <ul className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>First row must be headers (columns names)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>Required columns:</strong> "Company Name", "Company Type"</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>Optional columns:</strong> "Address", "Phone"</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <span>Excel files (.xlsx) are not supported. Please save as CSV format.</span>
            </li>
          </ul>
          <div className="mt-3 bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs font-mono overflow-x-auto">
            Company Name,Company Type,Address,Phone<br />
            Acme Corp,Manufacturing,123 Main St,555-1234<br />
            TechStart,Technology,456 Innovation Ave,555-5678
          </div>
        </div>
        
        {/* File Input and Upload Button */}
        <Input id="file-input" type="file" accept=".csv" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={uploading || !file} className="w-full">
          {uploading ? 'Uploading...' : 'Upload'} <Upload className="ml-2 w-4 h-4" />
        </Button>
        
        {/* Preview Section */}
        {preview.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Preview</h4>
            <ul className="divide-y">
              {preview.map((c, i) => (
                <li key={i} className="py-2">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-slate-500">{c.type}{c.address ? `, ${c.address}` : ''}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
