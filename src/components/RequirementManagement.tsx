
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Package, Calendar, Building2, Users, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRequirements, useEquipmentTypes, Requirement } from '@/hooks/useRequirements';
import { useCompanies } from '@/hooks/useCompanies';
import { useCustomers } from '@/hooks/useCustomers';

const RequirementManagement = () => {
  const { requirements, addRequirement, updateRequirement, deleteRequirement } = useRequirements();
  const { equipmentTypes, addEquipmentType } = useEquipmentTypes();
  const { companies } = useCompanies();
  const { customers } = useCustomers();
  
  const [isAddingRequirement, setIsAddingRequirement] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [newEquipmentName, setNewEquipmentName] = useState('');
  
  const [formData, setFormData] = useState({
    company_id: '',
    customer_id: '',
    equipment_name: '',
    required_period: '',
    status: 'pending',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_id || !formData.customer_id || !formData.equipment_name || !formData.required_period) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const requirementData = {
        company_id: formData.company_id,
        customer_id: formData.customer_id,
        equipment_name: formData.equipment_name,
        required_period: formData.required_period,
        status: formData.status,
        notes: formData.notes,
        recorded_date: new Date().toISOString().split('T')[0]
      };

      if (editingRequirement) {
        await updateRequirement(editingRequirement.id, requirementData);
        toast({
          title: "Success",
          description: "Requirement updated successfully",
        });
      } else {
        await addRequirement(requirementData);
        toast({
          title: "Success",
          description: "Requirement recorded successfully",
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving requirement:', error);
      toast({
        title: "Error",
        description: "Failed to save requirement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddEquipmentType = async () => {
    if (!newEquipmentName.trim()) return;

    try {
      await addEquipmentType(newEquipmentName.trim());
      toast({
        title: "Success",
        description: "Equipment type added successfully",
      });
      setNewEquipmentName('');
      setIsAddingEquipment(false);
    } catch (error) {
      console.error('Error adding equipment type:', error);
      toast({
        title: "Error",
        description: "Failed to add equipment type",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      company_id: '',
      customer_id: '',
      equipment_name: '',
      required_period: '',
      status: 'pending',
      notes: ''
    });
    setSelectedCompany('');
    setIsAddingRequirement(false);
    setEditingRequirement(null);
  };

  const handleEdit = (requirement: Requirement) => {
    setFormData({
      company_id: requirement.company_id,
      customer_id: requirement.customer_id,
      equipment_name: requirement.equipment_name,
      required_period: requirement.required_period,
      status: requirement.status,
      notes: requirement.notes || ''
    });
    setSelectedCompany(requirement.company_id);
    setEditingRequirement(requirement);
    setIsAddingRequirement(true);
  };

  const handleDelete = async (requirementId: string) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return;
    
    try {
      await deleteRequirement(requirementId);
      toast({
        title: "Success",
        description: "Requirement deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting requirement:', error);
    }
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(comp => comp.id === companyId);
    return company ? company.name : 'Unknown Company';
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(cust => cust.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getFilteredCustomers = () => {
    if (!selectedCompany && !formData.company_id) return [];
    const companyId = selectedCompany || formData.company_id;
    return customers.filter(customer => customer.company_id === companyId);
  };

  const handleCompanyChange = (companyId: string) => {
    setFormData(prev => ({ ...prev, company_id: companyId, customer_id: '' }));
    setSelectedCompany(companyId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Requirements Management</h2>
        <div className="flex gap-2">
          <Dialog open={isAddingEquipment} onOpenChange={setIsAddingEquipment}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Manage Equipment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Equipment Type</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="equipmentName">Equipment Name</Label>
                  <Input
                    id="equipmentName"
                    value={newEquipmentName}
                    onChange={(e) => setNewEquipmentName(e.target.value)}
                    placeholder="Enter equipment name"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddEquipmentType}>Add Equipment</Button>
                  <Button variant="outline" onClick={() => setIsAddingEquipment(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={() => setIsAddingRequirement(true)} 
            className="flex items-center gap-2"
            disabled={companies.length === 0 || customers.length === 0}
          >
            <Plus className="w-4 h-4" />
            Record Requirement
          </Button>
        </div>
      </div>

      {isAddingRequirement && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">{editingRequirement ? 'Edit Requirement' : 'Record New Requirement'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-foreground">Company *</Label>
                  <Select value={formData.company_id} onValueChange={handleCompanyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} ({company.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-foreground">Customer *</Label>
                  <Select 
                    value={formData.customer_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                    disabled={!formData.company_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredCustomers().map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} {customer.position && `(${customer.position})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment" className="text-foreground">Equipment *</Label>
                  <Select value={formData.equipment_name} onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_name: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map(equipment => (
                        <SelectItem key={equipment.id} value={equipment.name}>
                          {equipment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredPeriod" className="text-foreground">Required Period *</Label>
                  <Input
                    id="requiredPeriod"
                    type="date"
                    value={formData.required_period}
                    onChange={(e) => setFormData(prev => ({ ...prev, required_period: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this requirement..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingRequirement ? 'Update Requirement' : 'Record Requirement'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {(companies.length === 0 || customers.length === 0) && !isAddingRequirement && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Setup Required</h3>
            <p className="text-muted-foreground">
              You need to add companies and customers before recording requirements
            </p>
          </CardContent>
        </Card>
      )}

      {!isAddingRequirement && companies.length > 0 && customers.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] text-foreground">Company</TableHead>
                    <TableHead className="min-w-[120px] text-foreground">Customer</TableHead>
                    <TableHead className="min-w-[120px] text-foreground">Equipment</TableHead>
                    <TableHead className="min-w-[100px] text-foreground">Required Period</TableHead>
                    <TableHead className="min-w-[80px] text-foreground">Status</TableHead>
                    <TableHead className="min-w-[100px] text-foreground">Recorded Date</TableHead>
                    <TableHead className="min-w-[200px] text-foreground">Notes</TableHead>
                    <TableHead className="w-20 text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map(requirement => (
                    <TableRow key={requirement.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{getCompanyName(requirement.company_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{getCustomerName(requirement.customer_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{requirement.equipment_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{new Date(requirement.required_period).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          requirement.status === 'fulfilled' ? 'default' :
                          requirement.status === 'processing' ? 'secondary' :
                          requirement.status === 'pending' ? 'outline' :
                          'destructive'
                        }>
                          {requirement.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {new Date(requirement.recorded_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {requirement.notes ? (
                          <span className="text-sm line-clamp-2 text-foreground" title={requirement.notes}>
                            {requirement.notes.length > 50 ? `${requirement.notes.substring(0, 50)}...` : requirement.notes}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(requirement)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(requirement.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {requirements.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">No requirements found</h3>
                <p className="text-muted-foreground mb-4">No requirements have been recorded yet</p>
                <Button onClick={() => setIsAddingRequirement(true)}>Record Requirement</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RequirementManagement;
