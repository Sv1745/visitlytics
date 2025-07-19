import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Edit, Trash2, Users, Building2, Clock, Filter, Table as TableIcon, Grid, AlertCircle, CheckCircle, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useVisits, Visit } from '@/hooks/useVisits';
import { useCompanies } from '@/hooks/useCompanies';
import { useCustomers } from '@/hooks/useCustomers';
// import { useRequirements, useEquipmentTypes } from '@/hooks/useRequirements';
import { useRequirements } from '@/hooks/useRequirements';

import VisitDetailsModal from './VisitDetailsModal';

const ACTION_TYPES = [
  'Call',
  'Send Quotation',
  'Site Visit',
  'Email Follow-up',
  'Meeting',
  'Presentation',
  'Product Demo',
  'Contract Discussion'
];

const VisitTracker = () => {
  const { visits, addVisit, updateVisit, deleteVisit } = useVisits();
  const { companies } = useCompanies();
  const { customers } = useCustomers();
  const { addRequirement } = useRequirements();
  // const { equipmentTypes } = useEquipmentTypes();
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [filters, setFilters] = useState({
    company_id: 'all',
    customer_id: 'all',
    action_type: 'all',
    status: 'all'
  });
  const [formData, setFormData] = useState({
    company_id: '',
    customer_id: '',
    action_type: '',
    visit_date: '',
    notes: '',
    next_follow_up: '',
    next_action_type: '',
    status: 'completed'
  });
  const [requirementData, setRequirementData] = useState({
    equipment_name: '',
    required_period: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_id || !formData.customer_id || !formData.action_type || !formData.visit_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const visitData = {
        company_id: formData.company_id,
        customer_id: formData.customer_id,
        action_type: formData.action_type,
        visit_date: formData.visit_date,
        notes: formData.notes,
        next_follow_up: formData.next_follow_up || null,
        next_action_type: formData.next_action_type || null,
        status: formData.status
      };

      if (editingVisit) {
        await updateVisit(editingVisit.id, visitData);
        toast({
          title: "Success",
          description: "Visit updated successfully",
        });
      } else {
        await addVisit(visitData);
        toast({
          title: "Success",
          description: "Visit recorded successfully",
        });
      }

      // If requirement form is shown and has data, save requirement too
      if (showRequirementForm && requirementData.equipment_name && requirementData.required_period) {
        const requirement = {
          company_id: formData.company_id,
          customer_id: formData.customer_id,
          equipment_name: requirementData.equipment_name,
          required_period: requirementData.required_period,
          status: 'pending',
          notes: requirementData.notes,
          recorded_date: new Date().toISOString().split('T')[0]
        };
        
        await addRequirement(requirement);
        toast({
          title: "Success",
          description: "Requirement also recorded successfully",
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving visit:', error);
      toast({
        title: "Error",
        description: "Failed to save visit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkComplete = async (visitId: string) => {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;

    // Prompt for completion notes
    const completionNotes = prompt('Please enter completion notes for this follow-up:');
    if (completionNotes === null) return; // User cancelled

    try {
      const updatedNotes = visit.notes ? 
        `${visit.notes}\n\n--- Completion Notes ---\n${completionNotes}` : 
        `--- Completion Notes ---\n${completionNotes}`;

      await updateVisit(visitId, { 
        status: 'completed',
        notes: updatedNotes
      });
      toast({
        title: "Success",
        description: "Visit marked as completed",
      });
    } catch (error) {
      console.error('Error marking visit as complete:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      company_id: '',
      customer_id: '',
      action_type: '',
      visit_date: '',
      notes: '',
      next_follow_up: '',
      next_action_type: '',
      status: 'completed'
    });
    setRequirementData({
      equipment_name: '',
      required_period: '',
      notes: ''
    });
    setSelectedCompany('');
    setIsAddingVisit(false);
    setEditingVisit(null);
    setShowRequirementForm(false);
  };

  const handleEdit = (visit: Visit) => {
    setFormData({
      company_id: visit.company_id,
      customer_id: visit.customer_id,  
      action_type: visit.action_type,
      visit_date: visit.visit_date,
      notes: visit.notes || '',
      next_follow_up: visit.next_follow_up || '',
      next_action_type: visit.next_action_type || '',
      status: visit.status
    });
    setSelectedCompany(visit.company_id);
    setEditingVisit(visit);
    setIsAddingVisit(true);
  };

  const handleDelete = async (visitId: string) => {
    if (!confirm('Are you sure you want to delete this visit?')) return;
    
    try {
      await deleteVisit(visitId);
      toast({
        title: "Success",
        description: "Visit deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting visit:', error);
    }
  };

  const handleCardClick = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(comp => comp.id === companyId);
    return company ? company.name : 'Unknown Company';
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(cust => cust.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getCompanyLogo = (companyId: string) => {
    const company = companies.find(comp => comp.id === companyId);
    return company ? company.logo : null;
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

  const getFilteredVisits = () => {
    let filtered = [...visits];

    if (filters.company_id !== 'all') {
      filtered = filtered.filter(visit => visit.company_id === filters.company_id);
    }
    if (filters.customer_id !== 'all') {
      filtered = filtered.filter(visit => visit.customer_id === filters.customer_id);
    }
    if (filters.action_type !== 'all') {
      filtered = filtered.filter(visit => visit.action_type === filters.action_type);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(visit => visit.status === filters.status);
    }

    return filtered.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  };

  const getActiveVisits = () => {
    return getFilteredVisits().filter(visit => visit.status === 'pending' || visit.next_follow_up);
  };

  const getCompletedVisits = () => {
    return getFilteredVisits().filter(visit => visit.status === 'completed');
  };

  const getFollowUpStatus = (followUpDate: string, status: string) => {
    if (!followUpDate || status === 'completed') return null;
    
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = followUp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', days: Math.abs(diffDays) };
    if (diffDays === 0) return { status: 'today', days: 0 };
    if (diffDays <= 2) return { status: 'urgent', days: diffDays };
    return { status: 'scheduled', days: diffDays };
  };

  const sortedVisits = activeTab === 'active' ? getActiveVisits() : getCompletedVisits();

  console.log('VisitTracker render - isAddingVisit:', isAddingVisit);
  console.log('Companies count:', companies.length);
  console.log('Customers count:', customers.length);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Visit Tracker</h2>
        <Button 
          onClick={() => {
            console.log('Record Visit button clicked');
            setIsAddingVisit(true);
          }} 
          className="flex items-center gap-2"
          disabled={companies.length === 0 || customers.length === 0}
        >
          <Plus className="w-4 h-4" />
          Record Visit
        </Button>
      </div>

      {/* Add Visit Form - Always show when isAddingVisit is true */}
      {isAddingVisit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">{editingVisit ? 'Edit Visit' : 'Record New Visit'}</CardTitle>
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
                  <Label htmlFor="actionType" className="text-foreground">Action Type *</Label>
                  <Select value={formData.action_type} onValueChange={(value) => setFormData(prev => ({ ...prev, action_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map(action => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitDate" className="text-foreground">Action Date *</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={formData.visit_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextFollowUp" className="text-foreground">Next Action Date</Label>
                  <Input
                    id="nextFollowUp"
                    type="date"
                    value={formData.next_follow_up}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_follow_up: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextActionType" className="text-foreground">Next Action Type</Label>
                  <Select value={formData.next_action_type} onValueChange={(value) => setFormData(prev => ({ ...prev, next_action_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select next action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ACTION_TYPES.map(action => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Requirement Section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="hasRequirement"
                    checked={showRequirementForm}
                    onChange={(e) => setShowRequirementForm(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="hasRequirement" className="text-foreground">
                    Customer mentioned a requirement during this visit
                  </Label>
                </div>

                {showRequirementForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="equipmentName" className="text-foreground">Equipment Required *</Label>
                      <Select 
                        value={requirementData.equipment_name} 
                        onValueChange={(value) => setRequirementData(prev => ({ ...prev, equipment_name: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* No equipment types available */}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requiredPeriod" className="text-foreground">Required Period *</Label>
                      <Input
                        id="requiredPeriod"
                        type="date"
                        value={requirementData.required_period}
                        onChange={(e) => setRequirementData(prev => ({ ...prev, required_period: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="requirementNotes" className="text-foreground">Requirement Notes</Label>
                      <Textarea
                        id="requirementNotes"
                        value={requirementData.notes}
                        onChange={(e) => setRequirementData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional details about the requirement..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this visit..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingVisit ? 'Update Visit' : 'Record Visit'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Setup Required Message */}
      {(companies.length === 0 || customers.length === 0) && !isAddingVisit && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Setup Required</h3>
            <p className="text-muted-foreground">
              You need to add companies and customers before recording visits
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Only show if not adding visit or if no setup is required */}
      {!isAddingVisit && companies.length > 0 && customers.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Active Visits ({getActiveVisits().length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History ({getCompletedVisits().length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Filter className="w-5 h-5" />
                    Filters
                  </CardTitle>
                  <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value)}>
                    <ToggleGroupItem value="cards" aria-label="Card view">
                      <Grid className="w-4 h-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="table" aria-label="Table view">
                      <TableIcon className="w-4 h-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Company</Label>
                  <Select value={filters.company_id} onValueChange={(value) => setFilters(prev => ({ ...prev, company_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All companies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All companies</SelectItem>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Customer</Label>
                  <Select value={filters.customer_id} onValueChange={(value) => setFilters(prev => ({ ...prev, customer_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All customers</SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Action Type</Label>
                  <Select value={filters.action_type} onValueChange={(value) => setFilters(prev => ({ ...prev, action_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      {ACTION_TYPES.map(action => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Visit Display */}
            {viewMode === 'table' ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px] text-foreground">Company</TableHead>
                          <TableHead className="min-w-[120px] text-foreground">Customer</TableHead>
                          <TableHead className="min-w-[100px] text-foreground">Action</TableHead>
                          <TableHead className="min-w-[100px] text-foreground">Date</TableHead>
                          <TableHead className="min-w-[80px] text-foreground">Status</TableHead>
                          <TableHead className="min-w-[150px] text-foreground">Next Follow-up</TableHead>
                          <TableHead className="min-w-[120px] text-foreground">Next Action</TableHead>
                          <TableHead className="min-w-[200px] text-foreground">Notes</TableHead>
                          <TableHead className="w-20 text-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedVisits.map(visit => {
                          const followUpStatus = getFollowUpStatus(visit.next_follow_up || '', visit.status);
                          return (
                            <TableRow key={visit.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleCardClick(visit)}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getCompanyLogo(visit.company_id) ? (
                                    <img 
                                      src={getCompanyLogo(visit.company_id)} 
                                      alt="Company logo" 
                                      className="w-6 h-6 object-cover rounded border"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center">
                                      <Building2 className="w-3 h-3 text-purple-600" />
                                    </div>
                                  )}
                                  <span className="font-medium text-foreground">{getCompanyName(visit.company_id)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-foreground">{getCustomerName(visit.customer_id)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{visit.action_type}</Badge>
                              </TableCell>
                              <TableCell className="text-foreground">{new Date(visit.visit_date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={visit.status === 'completed' ? 'default' : visit.status === 'pending' ? 'secondary' : 'destructive'}>
                                  {visit.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {visit.next_follow_up ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-sm text-foreground">
                                      <Clock className="w-3 h-3" />
                                      {new Date(visit.next_follow_up).toLocaleDateString()}
                                    </div>
                                    {followUpStatus && (
                                      <Badge 
                                        variant={
                                          followUpStatus.status === 'overdue' ? 'destructive' :
                                          followUpStatus.status === 'today' ? 'default' :
                                          followUpStatus.status === 'urgent' ? 'secondary' :
                                          'outline'
                                        }
                                        className="text-xs"
                                      >
                                        {followUpStatus.status === 'overdue' ? `${followUpStatus.days}d overdue` :
                                         followUpStatus.status === 'today' ? 'Today' :
                                         followUpStatus.status === 'urgent' ? `${followUpStatus.days}d left` :
                                         `${followUpStatus.days}d`}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {visit.next_action_type ? (
                                  <Badge variant="outline" className="text-xs">
                                    {visit.next_action_type}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {visit.notes ? (
                                  <span className="text-sm line-clamp-2 text-foreground" title={visit.notes}>
                                    {visit.notes.length > 50 ? `${visit.notes.substring(0, 50)}...` : visit.notes}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                  {visit.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMarkComplete(visit.id)}
                                      className="h-6 w-6 p-0"
                                      title="Mark as complete"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(visit)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(visit.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedVisits.map(visit => {
                  const followUpStatus = getFollowUpStatus(visit.next_follow_up || '', visit.status);
                  return (
                    <Card 
                      key={visit.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer" 
                      onClick={() => handleCardClick(visit)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getCompanyLogo(visit.company_id) ? (
                              <img 
                                src={getCompanyLogo(visit.company_id)} 
                                alt="Company logo" 
                                className="w-10 h-10 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-purple-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate text-foreground">
                                {visit.action_type}
                              </h3>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span className="truncate text-foreground">{getCompanyName(visit.company_id)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span className="truncate text-foreground">{getCustomerName(visit.customer_id)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            {visit.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkComplete(visit.id)}
                                className="h-6 w-6 p-0"
                                title="Mark as complete"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(visit)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(visit.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant={visit.status === 'completed' ? 'default' : visit.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                              {visit.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(visit.visit_date).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {visit.next_follow_up && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>Next: {new Date(visit.next_follow_up).toLocaleDateString()}</span>
                                </div>
                                {followUpStatus && (
                                  <Badge 
                                    variant={
                                      followUpStatus.status === 'overdue' ? 'destructive' :
                                      followUpStatus.status === 'today' ? 'default' :
                                      followUpStatus.status === 'urgent' ? 'secondary' :
                                      'outline'
                                    }
                                    className="text-xs flex items-center gap-1"
                                  >
                                    {followUpStatus.status === 'overdue' && <AlertCircle className="w-3 h-3" />}
                                    {followUpStatus.status === 'overdue' ? `${followUpStatus.days}d overdue` :
                                     followUpStatus.status === 'today' ? 'Today' :
                                     followUpStatus.status === 'urgent' ? `${followUpStatus.days}d left` :
                                     `${followUpStatus.days}d`}
                                  </Badge>
                                )}
                              </div>
                              {visit.next_action_type && (
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-muted-foreground">Action:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {visit.next_action_type}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}

                          {visit.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {visit.notes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {sortedVisits.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-foreground">No visits found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'active' ? 'No active visits or follow-ups scheduled' : 'No completed visits recorded yet'}
                  </p>
                  <Button onClick={() => setIsAddingVisit(true)}>Record Visit</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Same structure as active tab but for completed visits */}
            {viewMode === 'table' ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px] text-foreground">Company</TableHead>
                          <TableHead className="min-w-[120px] text-foreground">Customer</TableHead>
                          <TableHead className="min-w-[100px] text-foreground">Action</TableHead>
                          <TableHead className="min-w-[100px] text-foreground">Date</TableHead>
                          <TableHead className="min-w-[200px] text-foreground">Notes</TableHead>
                          <TableHead className="w-20 text-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedVisits.map(visit => (
                          <TableRow key={visit.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleCardClick(visit)}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getCompanyLogo(visit.company_id) ? (
                                  <img 
                                    src={getCompanyLogo(visit.company_id)} 
                                    alt="Company logo" 
                                    className="w-6 h-6 object-cover rounded border"
                                  />
                                ) : (
                                  <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center">
                                    <Building2 className="w-3 h-3 text-purple-600" />
                                  </div>
                                )}
                                <span className="font-medium text-foreground">{getCompanyName(visit.company_id)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">{getCustomerName(visit.customer_id)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{visit.action_type}</Badge>
                            </TableCell>
                            <TableCell className="text-foreground">{new Date(visit.visit_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {visit.notes ? (
                                <span className="text-sm line-clamp-2 text-foreground" title={visit.notes}>
                                  {visit.notes.length > 50 ? `${visit.notes.substring(0, 50)}...` : visit.notes}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(visit)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(visit.id)}
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
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedVisits.map(visit => (
                  <Card 
                    key={visit.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => handleCardClick(visit)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getCompanyLogo(visit.company_id) ? (
                            <img 
                              src={getCompanyLogo(visit.company_id)} 
                              alt="Company logo" 
                              className="w-10 h-10 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate text-foreground">
                              {visit.action_type}
                            </h3>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span className="truncate text-foreground">{getCompanyName(visit.company_id)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span className="truncate text-foreground">{getCustomerName(visit.customer_id)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(visit)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(visit.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="default" className="text-xs">
                            Completed
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(visit.visit_date).toLocaleDateString()}
                          </span>
                        </div>

                        {visit.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {visit.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {sortedVisits.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-foreground">No completed visits</h3>
                  <p className="text-muted-foreground">Completed visits will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      <VisitDetailsModal 
        visit={selectedVisit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyName={selectedVisit ? getCompanyName(selectedVisit.company_id) : ''}
        customerName={selectedVisit ? getCustomerName(selectedVisit.customer_id) : ''}
        companyLogo={selectedVisit ? getCompanyLogo(selectedVisit.company_id) : undefined}
      />
    </div>
  );
};

export default VisitTracker;
