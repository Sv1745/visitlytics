import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Phone,
  Mail,
  Users,
  FileText,
  ArrowRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTasks, Task } from '@/hooks/useTasks';
import { useOpportunities } from '@/hooks/useOpportunities';

const TASK_TYPES = [
  { id: 'call', label: 'Call', icon: Phone, color: 'bg-blue-100 text-blue-800' },
  { id: 'meeting', label: 'Meeting', icon: Users, color: 'bg-green-100 text-green-800' },
  { id: 'email', label: 'Email', icon: Mail, color: 'bg-purple-100 text-purple-800' },
  { id: 'quotation', label: 'Quotation', icon: FileText, color: 'bg-orange-100 text-orange-800' },
  { id: 'followup', label: 'Follow-up', icon: ArrowRight, color: 'bg-yellow-100 text-yellow-800' },
] as const;

interface TaskFormData {
  title: string;
  type: Task['type'];
  related_opportunity_id: string;
  due_date: string;
  notes: string;
}

const TaskManagement = () => {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    completeTask,
    getTodayTasks,
    getOverdueTasks,
    getUpcomingTasks
  } = useTasks();
  const { opportunities } = useOpportunities();
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all');
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    type: 'call',
    related_opportunity_id: '',
    due_date: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'call',
      related_opportunity_id: '',
      due_date: '',
      notes: ''
    });
    setEditingTask(null);
    setIsAddingTask(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted with data:", formData);
    
    if (!formData.title || !formData.due_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const taskData = {
        title: formData.title.trim(),
        type: formData.type,
        due_date: formData.due_date,
        status: 'pending' as const,
        // Only include optional fields if they have valid values
        ...(formData.related_opportunity_id && 
            formData.related_opportunity_id !== 'none' && 
            formData.related_opportunity_id !== '' && 
            { related_opportunity_id: formData.related_opportunity_id }),
        ...(formData.notes && 
            formData.notes.trim() !== '' && 
            { notes: formData.notes.trim() })
      };

      console.log("Processed task data:", taskData);

      if (editingTask) {
        console.log("Updating existing task:", editingTask.id);
        await updateTask(editingTask.id, taskData);
      } else {
        console.log("Creating new task");
        await addTask(taskData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Error", 
        description: `Failed to save task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId);
  };

  const getFilteredTasks = () => {
    switch (activeFilter) {
      case 'today':
        return getTodayTasks();
      case 'overdue':
        return getOverdueTasks();
      case 'upcoming':
        return getUpcomingTasks();
      default:
        return tasks;
    }
  };

  const getOpportunityTitle = (opportunityId?: string) => {
    if (!opportunityId) return 'No opportunity linked';
    return opportunities.find(opp => opp.id === opportunityId)?.title || 'Unknown opportunity';
  };

  const getTaskTypeInfo = (type: Task['type']) => {
    return TASK_TYPES.find(t => t.id === type) || TASK_TYPES[0];
  };

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    }
  };

  const getPriorityColor = (dueDate: string, status: Task['status']) => {
    if (status === 'completed') return 'border-green-200';
    if (status === 'overdue') return 'border-red-300 bg-red-50';
    
    const due = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'border-orange-300 bg-orange-50';
    if (diffDays <= 3) return 'border-yellow-300 bg-yellow-50';
    return 'border-gray-200';
  };

  const todayTasks = getTodayTasks();
  const overdueTasks = getOverdueTasks();
  const upcomingTasks = getUpcomingTasks();
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const TaskCard = ({ task }: { task: Task }) => {
    const typeInfo = getTaskTypeInfo(task.type);
    const Icon = typeInfo.icon;
    
    const handleEditTask = () => {
      setFormData({
        title: task.title,
        type: task.type,
        related_opportunity_id: task.related_opportunity_id || 'none',
        due_date: task.due_date.split('T')[0], // Convert to date format
        notes: task.notes || ''
      });
      setEditingTask(task);
      setIsAddingTask(true);
    };
    
    return (
      <Card className={`mb-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(task.due_date, task.status)}`} onClick={handleEditTask}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <h4 className="font-medium">{task.title}</h4>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(task.status)}
              {task.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click when completing task
                    handleCompleteTask(task.id);
                  }}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
            </div>
            
            {task.related_opportunity_id && (
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                <span>{getOpportunityTitle(task.related_opportunity_id)}</span>
              </div>
            )}
            
            {task.notes && (
              <p className="mt-2 text-sm">{task.notes}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tasks & Reminders</h2>
          <p className="text-muted-foreground">Manage your tasks and stay on top of follow-ups</p>
        </div>
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </DialogTitle>
              <DialogDescription>
                {editingTask ? 'Update task details and settings.' : 'Create a new task to track your activities and follow-ups.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Task Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Task['type']) => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="opportunity">Related Opportunity (Optional)</Label>
                <Select
                  value={formData.related_opportunity_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, related_opportunity_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select opportunity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No opportunity</SelectItem>
                    {opportunities.map((opportunity) => (
                      <SelectItem key={opportunity.id} value={opportunity.id}>
                        {opportunity.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter task notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTask ? 'Update' : 'Create'} Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Tasks</p>
                <p className="text-2xl font-bold">{todayTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{overdueTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Filters and Views */}
      <Tabs value={activeFilter} onValueChange={(value: any) => setActiveFilter(value)}>
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {getFilteredTasks().map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>
        
        <TabsContent value="today" className="space-y-4">
          {todayTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks for today</h3>
                <p className="text-muted-foreground">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="overdue" className="space-y-4">
          {overdueTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">No overdue tasks</h3>
                <p className="text-muted-foreground">Great job staying on top of things!</p>
              </CardContent>
            </Card>
          ) : (
            overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskManagement;
