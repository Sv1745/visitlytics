import { useState, useEffect } from "react";
import { db } from "@/integrations/firebase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export interface Task {
  id: string;
  title: string;
  type: "call" | "meeting" | "email" | "quotation" | "followup";
  related_opportunity_id?: string;
  due_date: string;
  status: "pending" | "completed" | "overdue";
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchTasks = async () => {
    if (!isAuthenticated || !user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    
    try {
      const q = query(
        collection(db, "tasks"),
        where("user_id", "==", user.uid),
        orderBy("due_date", "asc")
      );
      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const task = { id: doc.id, ...data } as Task;
        
        // Check if task is overdue
        const dueDate = new Date(task.due_date);
        const today = new Date();
        if (task.status === "pending" && dueDate < today) {
          task.status = "overdue";
        }
        
        return task;
      });
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!isAuthenticated || !user) {
      console.error("Authentication failed:", { isAuthenticated, user: !!user });
      toast({
        title: "Error",
        description: "You must be logged in to create tasks",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Creating task with data:", taskData);
      
      // Clean the data - Firebase doesn't accept undefined values
      const cleanedData = {
        title: taskData.title,
        type: taskData.type,
        due_date: taskData.due_date,
        status: taskData.status,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Only add optional fields if they have values
        ...(taskData.related_opportunity_id && 
            taskData.related_opportunity_id !== 'none' && 
            taskData.related_opportunity_id !== '' && 
            { related_opportunity_id: taskData.related_opportunity_id }),
        ...(taskData.notes && 
            taskData.notes.trim() !== '' && 
            { notes: taskData.notes.trim() })
      };
      
      console.log("Cleaned task data:", cleanedData);
      
      const docRef = await addDoc(collection(db, "tasks"), cleanedData);
      const createdTask = { id: docRef.id, ...cleanedData };
      setTasks(prev => [...prev, createdTask].sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      ));
      
      console.log("Task created successfully:", createdTask);
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'user_id'>>) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      await updateDoc(doc(db, "tasks", id), updateData);
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updateData } : task
      ));
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (id: string) => {
    if (!isAuthenticated || !user) return;
    
    try {
      await deleteDoc(doc(db, "tasks", id));
      setTasks(prev => prev.filter(task => task.id !== id));
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const completeTask = async (id: string) => {
    await updateTask(id, { status: "completed" });
  };

  // Helper functions for filtering
  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    
    return tasks.filter(task => {
      if (task.status === "completed") return false;
      
      const taskDate = new Date(task.due_date);
      
      // Include tasks due today OR overdue tasks (they need attention today)
      return task.due_date.startsWith(today) || taskDate < todayDate;
    });
  };

  const getOverdueTasks = () => {
    const today = new Date();
    return tasks.filter(task => {
      if (task.status === "completed") return false;
      const taskDate = new Date(task.due_date);
      return taskDate < today;
    });
  };

  const getUpcomingTasks = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return taskDate > today && taskDate <= nextWeek && task.status === "pending";
    });
  };

  useEffect(() => {
    fetchTasks();
  }, [isAuthenticated, user]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    getTodayTasks,
    getOverdueTasks,
    getUpcomingTasks,
    refetch: fetchTasks
  };
};
