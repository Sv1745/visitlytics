
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Users, Building2, TrendingUp, Bell, Plus, Download, Phone, Clock, AlertCircle, Package, Settings } from 'lucide-react';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { CompanyManagement } from '@/components/CompanyManagement';
import CustomerManagement from '@/components/CustomerManagement';
import VisitTracker from '@/components/VisitTracker';
import ExportReport from '@/components/ExportReport';
import RequirementManagement from '@/components/RequirementManagement';
import { useCompanies } from '@/hooks/useCompanies';
import { useCustomers } from '@/hooks/useCustomers';
import { useVisits } from '@/hooks/useVisits';
import { useRequirements } from '@/hooks/useRequirements';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { companies } = useCompanies();
  const { customers } = useCustomers();
  const { visits } = useVisits();
  const { requirements } = useRequirements();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard statistics
  const totalCompanies = companies.length;
  const totalCustomers = customers.length;
  const totalVisits = visits.length;
  const totalRequirements = requirements.length;
  
  // Requirements analysis
  const pendingRequirements = requirements.filter(req => req.status === 'pending').length;
  const processingRequirements = requirements.filter(req => req.status === 'processing').length;
  const upcomingRequirements = requirements.filter(req => {
    const reqDate = new Date(req.required_period);
    const today = new Date();
    const diffTime = reqDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }).length;
  
  // Follow-up analysis - only count non-completed visits as overdue
  const today = new Date();
  const followUpAnalysis = visits.reduce((acc, visit) => {
    if (!visit.next_follow_up) return acc;
    
    // Don't count overdue if status is completed
    if (visit.status === 'completed') {
      acc.scheduled++;
      return acc;
    }
    
    const followUpDate = new Date(visit.next_follow_up);
    const diffTime = followUpDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      acc.overdue++;
    } else if (diffDays === 0) {
      acc.today++;
    } else if (diffDays <= 2) {
      acc.upcoming++;
    } else {
      acc.scheduled++;
    }
    
    return acc;
  }, { overdue: 0, today: 0, upcoming: 0, scheduled: 0 });

  // Action type analysis for summary
  const actionSummary = visits.reduce((acc, visit) => {
    if (visit.action_type === 'Call') {
      acc.calls++;
    } else if (visit.action_type.includes('Follow-up')) {
      acc.followups++;
    } else if (visit.action_type === 'Meeting') {
      acc.meetings++;
    } else {
      acc.other++;
    }
    return acc;
  }, { calls: 0, followups: 0, meetings: 0, other: 0 });

  // Next action analysis
  const nextActionSummary = visits.reduce((acc, visit) => {
    if (!visit.next_action_type || visit.status === 'completed') return acc;
    
    if (visit.next_action_type === 'Call') {
      acc.calls++;
    } else if (visit.next_action_type.includes('Follow-up')) {
      acc.followups++;
    } else if (visit.next_action_type === 'Meeting') {
      acc.meetings++;
    } else {
      acc.other++;
    }
    return acc;
  }, { calls: 0, followups: 0, meetings: 0, other: 0 });

  const pendingFollowUps = followUpAnalysis.overdue + followUpAnalysis.today + followUpAnalysis.upcoming;

  // Company type distribution
  const companyTypeData = companies.reduce((acc, company) => {
    const existing = acc.find(item => item.type === company.type);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ type: company.type, count: 1 });
    }
    return acc;
  }, []);

  // Visit action type distribution
  const actionTypeData = visits.reduce((acc, visit) => {
    const existing = acc.find(item => item.action === visit.action_type);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ action: visit.action_type, count: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'];

  // Check for upcoming follow-ups on component mount
  useEffect(() => {
    if (pendingFollowUps > 0) {
      toast({
        title: "Reminder Alert",
        description: `You have ${pendingFollowUps} follow-up(s) that need attention!`,
        variant: "default",
      });
    }
  }, [pendingFollowUps]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <AuthHeader />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-fit lg:grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="visits" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Visits
            </TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Requirements
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {pendingFollowUps > 0 && (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <Bell className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <strong>Reminder:</strong> You have {pendingFollowUps} follow-up(s) that need attention!
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                  <Building2 className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCompanies}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCustomers}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                  <Calendar className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalVisits}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Requirements</CardTitle>
                  <Package className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRequirements}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
                  <Bell className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingFollowUps}</div>
                </CardContent>
              </Card>
            </div>

            {/* Requirements Status Cards */}
            {totalRequirements > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending Requirements</CardTitle>
                    <Package className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{pendingRequirements}</div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Awaiting processing</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Processing</CardTitle>
                    <Settings className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{processingRequirements}</div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Being processed</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Upcoming (30 days)</CardTitle>
                    <Calendar className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{upcomingRequirements}</div>
                    <p className="text-xs text-green-600 dark:text-green-400">Due within 30 days</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Next Action Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Next Calls</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{nextActionSummary.calls}</div>
                  <p className="text-xs text-muted-foreground">Scheduled calls</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Next Follow-ups</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{nextActionSummary.followups}</div>
                  <p className="text-xs text-muted-foreground">Pending follow-ups</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Next Meetings</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{nextActionSummary.meetings}</div>
                  <p className="text-xs text-muted-foreground">Upcoming meetings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Other Actions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{nextActionSummary.other}</div>
                  <p className="text-xs text-muted-foreground">Other activities</p>
                </CardContent>
              </Card>
            </div>

            {/* Follow-up Status Cards */}
            {pendingFollowUps > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Overdue</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">{followUpAnalysis.overdue}</div>
                    <p className="text-xs text-red-600 dark:text-red-400">Need immediate attention</p>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Due Today</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{followUpAnalysis.today}</div>
                    <p className="text-xs text-orange-600 dark:text-orange-400">Due today</p>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Upcoming</CardTitle>
                    <Bell className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{followUpAnalysis.upcoming}</div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Within 2 days</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Companies by Type</CardTitle>
                  <CardDescription>Distribution of companies across different industries</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={companyTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Visit Actions</CardTitle>
                  <CardDescription>Breakdown of visit types and actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={actionTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ action, percent }) => `${action} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {actionTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
                <CardDescription>Get started with common tasks</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button onClick={() => setActiveTab('companies')} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Company
                </Button>
                <Button onClick={() => setActiveTab('customers')} variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Button>
                <Button onClick={() => setActiveTab('visits')} variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Record Visit
                </Button>
                <Button onClick={() => setActiveTab('requirements')} variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Record Requirement
                </Button>
                <Button onClick={() => setActiveTab('reports')} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <CompanyManagement />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="visits">
            <VisitTracker />
          </TabsContent>

          <TabsContent value="requirements">
            <RequirementManagement />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView visits={visits} companies={companies} customers={customers} />
          </TabsContent>

          <TabsContent value="reports">
            <ExportReport visits={visits} companies={companies} customers={customers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const CalendarView = ({ visits, companies, customers }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return visits.filter(visit => {
      if (!visit.next_follow_up) return false;
      return visit.next_follow_up === dateStr;
    });
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(comp => comp.id === companyId);
    return company ? company.name : 'Unknown Company';
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(cust => cust.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const days = generateCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Follow-up Calendar</h2>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          >
            Previous
          </Button>
          <h3 className="text-lg font-semibold text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <Button 
            variant="outline" 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm p-2 text-foreground">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const events = getEventsForDate(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={index}
                  className={`min-h-[80px] p-2 border rounded-lg ${
                    isCurrentMonth ? 'bg-card' : 'bg-muted'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {day.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {events.map((visit, eventIndex) => (
                      <div 
                        key={eventIndex}
                        className="text-xs p-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded truncate"
                        title={`${visit.next_action_type || visit.action_type} - ${getCompanyName(visit.company_id)} - ${getCustomerName(visit.customer_id)}`}
                      >
                        {visit.next_action_type || visit.action_type}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
