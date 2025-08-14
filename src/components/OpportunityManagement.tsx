import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, DollarSign, Calendar, Users, Building2, Target, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useOpportunities, Opportunity } from '@/hooks/useOpportunities';
import { useCompanies } from '@/hooks/useCompanies';
import { useCustomers } from '@/hooks/useCustomers';
import { useTasks } from '@/hooks/useTasks';

const SALES_STAGES = [
  { id: 'cold_call', label: 'Cold Call', color: 'bg-gray-100 text-gray-800' },
  { id: 'lead', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
  { id: 'prospect', label: 'Prospect', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'followup', label: 'Follow-up', color: 'bg-orange-100 text-orange-800' },
  { id: 'quotation', label: 'Quotation', color: 'bg-purple-100 text-purple-800' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'won', label: 'Won', color: 'bg-green-100 text-green-800' },
  { id: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800' },
] as const;

interface OpportunityFormData {
  title: string;
  company_id: string;
  customer_id: string;
  stage: Opportunity['stage'];
  value: string;
  probability: string;
  expected_closing_date: string;
  description: string;
}

const OpportunityManagement = () => {
  const { opportunities, addOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();
  const { companies } = useCompanies();
  const { customers } = useCustomers();
  const { addTask } = useTasks();
  
  const [isAddingOpportunity, setIsAddingOpportunity] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedCompany, setSelectedCompany] = useState('');
  
  const [formData, setFormData] = useState<OpportunityFormData>({
    title: '',
    company_id: '',
    customer_id: '',
    stage: 'cold_call',
    value: '',
    probability: '',
    expected_closing_date: '',
    description: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      company_id: '',
      customer_id: '',
      stage: 'cold_call',
      value: '',
      probability: '',
      expected_closing_date: '',
      description: ''
    });
    setSelectedCompany('');
    setEditingOpportunity(null);
    setIsAddingOpportunity(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.company_id || !formData.customer_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const opportunityData = {
        title: formData.title,
        company_id: formData.company_id,
        customer_id: formData.customer_id,
        stage: formData.stage,
        value: formData.value ? parseFloat(formData.value) : undefined,
        probability: formData.probability ? parseFloat(formData.probability) : undefined,
        expected_closing_date: formData.expected_closing_date || undefined,
        description: formData.description || undefined,
      };

      if (editingOpportunity) {
        await updateOpportunity(editingOpportunity.id, opportunityData);
      } else {
        await addOpportunity(opportunityData);
        
        // Auto-create initial task for new opportunity
        await addTask({
          title: `Initial contact for ${formData.title}`,
          type: 'call',
          related_opportunity_id: '', // Will be set after opportunity is created
          due_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          notes: 'Initial contact task for new opportunity'
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving opportunity:', error);
    }
  };

  const handleStageChange = async (opportunityId: string, newStage: Opportunity['stage']) => {
    await updateOpportunity(opportunityId, { stage: newStage });
    
    // Auto-create task based on stage
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (opportunity) {
      let taskTitle = '';
      let taskType: 'call' | 'meeting' | 'email' | 'quotation' | 'followup' = 'followup';
      
      switch (newStage) {
        case 'lead':
          taskTitle = `Qualify lead: ${opportunity.title}`;
          taskType = 'call';
          break;
        case 'prospect':
          taskTitle = `Collect requirements: ${opportunity.title}`;
          taskType = 'meeting';
          break;
        case 'quotation':
          taskTitle = `Send quotation: ${opportunity.title}`;
          taskType = 'quotation';
          break;
        case 'negotiation':
          taskTitle = `Negotiate terms: ${opportunity.title}`;
          taskType = 'meeting';
          break;
      }
      
      if (taskTitle) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        await addTask({
          title: taskTitle,
          type: taskType,
          related_opportunity_id: opportunityId,
          due_date: tomorrow.toISOString().split('T')[0],
          status: 'pending',
        });
      }
    }
  };

  const filteredCustomers = customers.filter(customer => 
    selectedCompany ? customer.company_id === selectedCompany : true
  );

  const getOpportunitiesByStage = (stage: string) => {
    return opportunities.filter(opp => opp.stage === stage);
  };

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Unknown Company';
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
  };

  const getTotalValue = (stage?: string) => {
    const filteredOpps = stage ? opportunities.filter(opp => opp.stage === stage) : opportunities;
    return filteredOpps.reduce((total, opp) => total + (opp.value || 0), 0);
  };

  const getWeightedValue = () => {
    return opportunities.reduce((total, opp) => {
      const value = opp.value || 0;
      const probability = (opp.probability || 0) / 100;
      return total + (value * probability);
    }, 0);
  };

  const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm">{opportunity.title}</h4>
          <Badge variant="outline" className="text-xs">
            {opportunity.probability}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {getCompanyName(opportunity.company_id)}
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          {getCustomerName(opportunity.customer_id)}
        </p>
        {opportunity.value && (
          <div className="flex items-center gap-1 mb-2">
            <DollarSign className="h-3 w-3" />
            <span className="text-sm font-medium">${opportunity.value.toLocaleString()}</span>
          </div>
        )}
        {opportunity.expected_closing_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(opportunity.expected_closing_date).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const KanbanView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
      {SALES_STAGES.map((stage) => {
        const stageOpportunities = getOpportunitiesByStage(stage.id);
        const stageValue = getTotalValue(stage.id);
        
        return (
          <div key={stage.id} className="min-h-[400px]">
            <div className={`p-3 rounded-t-lg ${stage.color}`}>
              <h3 className="font-medium text-sm">{stage.label}</h3>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs">{stageOpportunities.length} deals</span>
                <span className="text-xs font-medium">${stageValue.toLocaleString()}</span>
              </div>
            </div>
            <div className="border border-t-0 rounded-b-lg p-3 min-h-[350px] bg-gray-50">
              {stageOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  onClick={() => {
                    setFormData({
                      title: opportunity.title,
                      company_id: opportunity.company_id,
                      customer_id: opportunity.customer_id,
                      stage: opportunity.stage,
                      value: opportunity.value?.toString() || '',
                      probability: opportunity.probability?.toString() || '',
                      expected_closing_date: opportunity.expected_closing_date || '',
                      description: opportunity.description || ''
                    });
                    setSelectedCompany(opportunity.company_id);
                    setEditingOpportunity(opportunity);
                    setIsAddingOpportunity(true);
                  }}
                >
                  <OpportunityCard opportunity={opportunity} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const ListView = () => (
    <div className="space-y-4">
      {opportunities.map((opportunity) => {
        const stage = SALES_STAGES.find(s => s.id === opportunity.stage);
        return (
          <Card key={opportunity.id} className="cursor-pointer hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{opportunity.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getCompanyName(opportunity.company_id)} • {getCustomerName(opportunity.customer_id)}
                  </p>
                  <div className="flex gap-4 mt-2">
                    {opportunity.value && (
                      <span className="text-sm">${opportunity.value.toLocaleString()}</span>
                    )}
                    {opportunity.expected_closing_date && (
                      <span className="text-sm text-muted-foreground">
                        Close: {new Date(opportunity.expected_closing_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={stage?.color}>
                    {stage?.label}
                  </Badge>
                  {opportunity.probability && (
                    <span className="text-sm text-muted-foreground">{opportunity.probability}%</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sales Pipeline</h2>
          <p className="text-muted-foreground">Manage your sales opportunities and track progress</p>
        </div>
        <Dialog open={isAddingOpportunity} onOpenChange={setIsAddingOpportunity}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOpportunity ? 'Edit Opportunity' : 'Create New Opportunity'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Opportunity Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter opportunity title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value: Opportunity['stage']) => 
                      setFormData(prev => ({ ...prev, stage: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALES_STAGES.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Select
                    value={formData.company_id}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, company_id: value, customer_id: '' }));
                      setSelectedCompany(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                    disabled={!formData.company_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="value">Deal Value ($)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData(prev => ({ ...prev, probability: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="closing_date">Expected Closing Date</Label>
                  <Input
                    id="closing_date"
                    type="date"
                    value={formData.expected_closing_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_closing_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter opportunity description..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingOpportunity ? 'Update' : 'Create'} Opportunity
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline</p>
                <p className="text-2xl font-bold">${getTotalValue().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Weighted Pipeline</p>
                <p className="text-2xl font-bold">${getWeightedValue().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Opportunities</p>
                <p className="text-2xl font-bold">
                  {opportunities.filter(opp => !['won', 'lost'].includes(opp.stage)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Won This Month</p>
                <p className="text-2xl font-bold">
                  {opportunities.filter(opp => opp.stage === 'won').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(value: 'kanban' | 'list') => setViewMode(value)}>
        <TabsList>
          <TabsTrigger value="kanban">Kanban View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban">
          <KanbanView />
        </TabsContent>
        
        <TabsContent value="list">
          <ListView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OpportunityManagement;
