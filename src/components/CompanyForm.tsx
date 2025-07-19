
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Link, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  logo?: string;
  user_id: string;
  created_at: string;
}

interface CompanyFormProps {
  onSubmit: (company: Omit<Company, 'id' | 'created_at' | 'user_id'>) => void;
  initialData?: Company;
  isEditing?: boolean;
}

const companyTypes = [
  'Pharmaceutical Manufacturing',
  'Biotechnology',
  'Medical Device Manufacturing',
  'Contract Research Organization (CRO)',
  'Contract Manufacturing Organization (CMO)',
  'Generic Drug Manufacturing',
  'Vaccine Manufacturing',
  'API (Active Pharmaceutical Ingredient) Manufacturing',
  'Pharmaceutical Distribution',
  'Clinical Research',
  'Regulatory Affairs',
  'Pharmaceutical Consulting',
  'Laboratory Services',
  'Medical Equipment',
  'Healthcare Technology',
  'Other'
];

export const CompanyForm: React.FC<CompanyFormProps> = ({ onSubmit, initialData, isEditing = false }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logo, setLogo] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setAddress(initialData.address || '');
      setPhone(initialData.phone || '');
      setLogo(initialData.logo || '');
    }
  }, [initialData]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Convert file to base64 data URL for display
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type) {
      toast({
        title: "Error",
        description: "Name and type are required",
        variant: "destructive",
      });
      return;
    }
    onSubmit({ name, type, address, phone, logo });
    if (!isEditing) {
      setName('');
      setType('');
      setAddress('');
      setPhone('');
      setLogo('');
      setUploadMethod('url');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          {isEditing ? 'Edit Company' : 'Add New Company'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Company Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company type" />
                </SelectTrigger>
                <SelectContent>
                  {companyTypes.map((companyType) => (
                    <SelectItem key={companyType} value={companyType}>
                      {companyType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Company Logo</Label>
            <div className="flex gap-2 mb-3">
              <Button
                type="button"
                variant={uploadMethod === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMethod('url')}
                className="flex items-center gap-2"
              >
                <Link className="h-4 w-4" />
                URL
              </Button>
              <Button
                type="button"
                variant={uploadMethod === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMethod('file')}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </div>

            {uploadMethod === 'url' ? (
              <Input
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="Enter logo URL"
              />
            ) : (
              <div className="space-y-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Select an image file from your computer
                </p>
              </div>
            )}

            {logo && (
              <div className="mt-3">
                <img
                  src={logo}
                  alt="Logo preview"
                  className="h-16 w-16 object-contain border rounded-lg"
                  onError={() => setLogo('')}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter company address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full">
            {isEditing ? 'Update Company' : 'Add Company'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
