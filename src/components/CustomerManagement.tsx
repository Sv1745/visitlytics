
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2, Building2, Mail, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCustomers } from '@/hooks/useCustomers';
import { useCompanies } from '@/hooks/useCompanies';

const CustomerManagement = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { companies } = useCompanies();
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    company_id: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.company_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        company_id: formData.company_id
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData);
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } else {
        await addCustomer(customerData);
        toast({
          title: "Success",
          description: "Customer added successfully",
        });
      }

      resetForm();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', position: '', company_id: '' });
    setIsAddingCustomer(false);
    setEditingCustomer(null);
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      position: customer.position,
      company_id: customer.company_id
    });
    setEditingCustomer(customer);
    setIsAddingCustomer(true);
  };

  const handleDelete = async (customerId) => {
    try {
      await deleteCustomer(customerId);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(comp => comp.id === companyId);
    return company ? company.name : 'Unknown Company';
  };

  const getCompanyLogo = (companyId) => {
    const company = companies.find(comp => comp.id === companyId);
    return company ? company.logo : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
        <Button 
          onClick={() => setIsAddingCustomer(true)} 
          className="flex items-center gap-2"
          disabled={companies.length === 0}
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {companies.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies available</h3>
            <p className="text-gray-500">You need to add companies first before adding customers</p>
          </CardContent>
        </Card>
      )}

      {isAddingCustomer && companies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Enter job position"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company">Company *</Label>
                  <Select value={formData.company_id} onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value }))}>
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
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(customer => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {getCompanyLogo(customer.company_id) ? (
                      <img 
                        src={getCompanyLogo(customer.company_id)} 
                        alt="Company logo" 
                        className="w-10 h-10 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                    {customer.position && (
                      <p className="text-sm text-gray-600 truncate">{customer.position}</p>
                    )}
                    <Badge variant="outline" className="text-xs mt-1">
                      {getCompanyName(customer.company_id)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(customer)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(customer.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                Added on {new Date(customer.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {customers.length === 0 && companies.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first customer</p>
            <Button onClick={() => setIsAddingCustomer(true)}>Add Customer</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerManagement;
