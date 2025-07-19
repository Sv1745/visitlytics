
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Building2, TrendingUp, Clock, CheckCircle, BarChart3 } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Building2,
      title: "Company Management",
      description: "Organize and track all your business relationships with detailed company profiles and contact information."
    },
    {
      icon: Users,
      title: "Customer Tracking",
      description: "Maintain comprehensive customer records with contact details, positions, and interaction history."
    },
    {
      icon: Calendar,
      title: "Visit Scheduler",
      description: "Record visits, schedule follow-ups, and never miss an important business meeting again."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Get insights into your business activities with comprehensive reports and visual analytics."
    },
    {
      icon: Clock,
      title: "Follow-up Reminders",
      description: "Stay on top of your business relationships with automated follow-up notifications."
    },
    {
      icon: CheckCircle,
      title: "Activity Tracking",
      description: "Monitor all your business activities including calls, meetings, and site visits."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md mb-8">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Visit Tracker</CardTitle>
            <CardDescription className="text-lg">
              Manage your business visits and customer relationships
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
                <feature.icon className="w-4 h-4" />
                <span>{feature.title}: {feature.description}</span>
              </div>
            ))}
          </div>
          {/* TODO: Add Firebase Auth UI sign-in button here */}
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPage;
