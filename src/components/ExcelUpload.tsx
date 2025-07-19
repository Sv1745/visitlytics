
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
      <CardContent>
        <Input id="file-input" type="file" accept=".csv" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={uploading || !file} className="mt-2">
          {uploading ? 'Uploading...' : 'Upload'} <Upload className="ml-2 w-4 h-4" />
        </Button>
        {preview.length > 0 && (
          <div className="mt-4">
            <h4>Preview</h4>
            <ul>
              {preview.map((c, i) => (
                <li key={i}>{c.name} - {c.type}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
