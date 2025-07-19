import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, Filter, FileDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface Company {
  id: string;
  name: string;
  type: string;
  logo?: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  company_id: string;
  position?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

interface Visit {
  id: string;
  company_id: string;
  customer_id: string;
  action_type: string;
  visit_date: string;
  notes?: string;
  next_follow_up?: string;
  status: string;
  created_at: string;
}

interface ExportReportProps {
  visits: Visit[];
  companies: Company[];
  customers: Customer[];
}

const ExportReport: React.FC<ExportReportProps> = ({ visits, companies, customers }) => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedCompanyType, setSelectedCompanyType] = useState('all');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState('all');

  const getCompanyName = (companyId: string) => {
    const company = companies.find(comp => comp.id === companyId);
    return company ? company.name : 'Unknown Company';
  };

  const getCompanyType = (companyId: string) => {
    const company = companies.find(comp => comp.id === companyId);
    return company ? company.type : 'Unknown Type';
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(cust => cust.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getFilteredVisits = () => {
    let filtered = [...visits];

    // Filter by date range
    if (dateRange.startDate) {
      filtered = filtered.filter(visit => new Date(visit.visit_date) >= new Date(dateRange.startDate));
    }
    if (dateRange.endDate) {
      filtered = filtered.filter(visit => new Date(visit.visit_date) <= new Date(dateRange.endDate));
    }

    // Filter by company
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(visit => visit.company_id === selectedCompany);
    }

    // Filter by customer
    if (selectedCustomer !== 'all') {
      filtered = filtered.filter(visit => visit.customer_id === selectedCustomer);
    }

    // Filter by company type
    if (selectedCompanyType !== 'all') {
      filtered = filtered.filter(visit => getCompanyType(visit.company_id) === selectedCompanyType);
    }

    // Filter by action type
    if (selectedActionType !== 'all') {
      filtered = filtered.filter(visit => visit.action_type === selectedActionType);
    }

    return filtered.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  };

  const exportToCSV = () => {
    const filteredVisits = getFilteredVisits();
    
    if (filteredVisits.length === 0) {
      toast({
        title: "No Data",
        description: "No visits found for the selected criteria",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Visit Date',
      'Company',
      'Company Type',
      'Customer',
      'Action Type',
      'Status',
      'Notes',
      'Next Follow-up',
      'Recorded Date'
    ];

    const csvData = filteredVisits.map(visit => [
      new Date(visit.visit_date).toLocaleDateString(),
      getCompanyName(visit.company_id),
      getCompanyType(visit.company_id),
      getCustomerName(visit.customer_id),
      visit.action_type,
      visit.status,
      visit.notes || '',
      visit.next_follow_up ? new Date(visit.next_follow_up).toLocaleDateString() : '',
      new Date(visit.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `visit-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Successful",
      description: `Exported ${filteredVisits.length} visits to CSV`,
    });
  };

  const exportToPDF = () => {
    const filteredVisits = getFilteredVisits();
    
    if (filteredVisits.length === 0) {
      toast({
        title: "No Data",
        description: "No visits found for the selected criteria",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Visit Report', 20, yPosition);
    yPosition += 15;

    // Date range
    doc.setFontSize(12);
    if (dateRange.startDate || dateRange.endDate) {
      const dateText = `Period: ${dateRange.startDate || 'All'} to ${dateRange.endDate || 'All'}`;
      doc.text(dateText, 20, yPosition);
      yPosition += 10;
    }

    doc.text(`Total Visits: ${filteredVisits.length}`, 20, yPosition);
    yPosition += 15;

    // Table headers
    doc.setFontSize(10);
    doc.text('Date', 20, yPosition);
    doc.text('Company', 50, yPosition);
    doc.text('Customer', 100, yPosition);
    doc.text('Action', 140, yPosition);
    doc.text('Status', 170, yPosition);
    yPosition += 10;

    // Table rows
    filteredVisits.forEach((visit, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      const visitDate = new Date(visit.visit_date).toLocaleDateString();
      const companyName = getCompanyName(visit.company_id).substring(0, 15);
      const customerName = getCustomerName(visit.customer_id).substring(0, 15);
      const actionType = visit.action_type.substring(0, 12);
      const status = visit.status;

      doc.text(visitDate, 20, yPosition);
      doc.text(companyName, 50, yPosition);
      doc.text(customerName, 100, yPosition);
      doc.text(actionType, 140, yPosition);
      doc.text(status, 170, yPosition);
      yPosition += 8;
    });

    doc.save(`visit-report-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredVisits.length} visits to PDF`,
    });
  };

  const companyTypes = [...new Set(companies.map(company => company.type))];
  const actionTypes = [...new Set(visits.map(visit => visit.action_type))];
  const filteredVisits = getFilteredVisits();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Export Reports</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Filter className="w-5 h-5" />
            Filter Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-foreground">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-foreground">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-foreground">Company</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
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
              <Label htmlFor="customer" className="text-foreground">Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
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
              <Label htmlFor="companyType" className="text-foreground">Company Type</Label>
              <Select value={selectedCompanyType} onValueChange={setSelectedCompanyType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {companyTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionType" className="text-foreground">Action Type</Label>
              <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {filteredVisits.length} visit(s) match your criteria
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} className="flex items-center gap-2" disabled={filteredVisits.length === 0}>
                <Download className="w-4 h-4" />
                Export to CSV
              </Button>
              <Button onClick={exportToPDF} className="flex items-center gap-2" disabled={filteredVisits.length === 0}>
                <FileDown className="w-4 h-4" />
                Export to PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="w-5 h-5" />
            Preview ({filteredVisits.length} visits)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVisits.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-foreground">No visits found</h3>
              <p className="text-muted-foreground">Adjust your filter criteria to see visits</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredVisits.slice(0, 10).map(visit => (
                <div key={visit.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{getCompanyName(visit.company_id)}</span>
                      <Badge variant="outline" className="text-xs">
                        {getCompanyType(visit.company_id)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getCustomerName(visit.customer_id)} • {visit.action_type} • {new Date(visit.visit_date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={visit.status === 'completed' ? 'default' : visit.status === 'pending' ? 'secondary' : 'destructive'}>
                    {visit.status}
                  </Badge>
                </div>
              ))}
              {filteredVisits.length > 10 && (
                <div className="text-center text-sm text-muted-foreground pt-2">
                  And {filteredVisits.length - 10} more visits...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {visits.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">No visits to export</h3>
            <p className="text-muted-foreground">Start recording visits to generate reports</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExportReport;
