
import React, { useState } from 'react';
import { useCompanies, Company } from '@/hooks/useCompanies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, MapPin, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ExcelUpload } from './ExcelUpload';
import { CompanyForm } from './CompanyForm';
import { CompanyMap } from './CompanyMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const CompanyManagement = () => {
  const { companies, loading, addCompany, updateCompany, deleteCompany } = useCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCompany = async (company: Omit<Company, 'id' | 'created_at' | 'user_id'>) => {
    try {
      await addCompany(company);
      toast({
        title: "Success",
        description: "Company added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add company",
        variant: "destructive",
      });
    }
  };

  const handleEditCompany = async (company: Omit<Company, 'id' | 'created_at' | 'user_id'>) => {
    if (!editingCompany) return;
    
    try {
      await updateCompany(editingCompany.id, company);
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingCompany(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await deleteCompany(id);
        toast({
          title: "Success",
          description: "Company deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete company",
          variant: "destructive",
        });
      }
    }
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading companies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Company Management</h2>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">Companies</TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Company
          </TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <Card key={company.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {company.logo && (
                          <img 
                            src={company.logo} 
                            alt={`${company.name} logo`}
                            className="w-8 h-8 object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                      </div>
                      <CardDescription>
                        <Badge variant="secondary">{company.type}</Badge>
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {company.address && (
                    <p className="text-sm text-gray-600 mb-2">{company.address}</p>
                  )}
                  {company.phone && (
                    <p className="text-sm text-gray-600">{company.phone}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No companies found. {searchTerm ? 'Try a different search term.' : 'Add your first company!'}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add" className="mt-4">
          <CompanyForm onSubmit={handleAddCompany} />
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <CompanyMap companies={companies} />
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <div className="flex justify-center">
            <ExcelUpload />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company information below
            </DialogDescription>
          </DialogHeader>
          {editingCompany && (
            <CompanyForm 
              onSubmit={handleEditCompany}
              initialData={editingCompany}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
