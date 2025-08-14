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

export interface Opportunity {
  id: string;
  company_id: string;
  customer_id: string;
  stage: "cold_call" | "lead" | "prospect" | "followup" | "quotation" | "negotiation" | "won" | "lost";
  value?: number;
  probability?: number; // for forecasting
  expected_closing_date?: string;
  title: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useOpportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchOpportunities = async () => {
    if (!isAuthenticated || !user) {
      setOpportunities([]);
      setLoading(false);
      return;
    }
    
    try {
      const q = query(
        collection(db, "opportunities"),
        where("user_id", "==", user.uid),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const opportunitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Opportunity[];
      setOpportunities(opportunitiesData);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      toast({
        title: "Error",
        description: "Failed to load opportunities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addOpportunity = async (opportunityData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const newOpportunity = {
        ...opportunityData,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, "opportunities"), newOpportunity);
      const createdOpportunity = { id: docRef.id, ...newOpportunity };
      setOpportunities(prev => [createdOpportunity, ...prev]);
      
      toast({
        title: "Success",
        description: "Opportunity created successfully",
      });
    } catch (error) {
      console.error("Error adding opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to create opportunity",
        variant: "destructive",
      });
    }
  };

  const updateOpportunity = async (id: string, updates: Partial<Omit<Opportunity, 'id' | 'created_at' | 'user_id'>>) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      await updateDoc(doc(db, "opportunities", id), updateData);
      setOpportunities(prev => prev.map(opp => 
        opp.id === id ? { ...opp, ...updateData } : opp
      ));
      
      toast({
        title: "Success",
        description: "Opportunity updated successfully",
      });
    } catch (error) {
      console.error("Error updating opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to update opportunity",
        variant: "destructive",
      });
    }
  };

  const deleteOpportunity = async (id: string) => {
    if (!isAuthenticated || !user) return;
    
    try {
      await deleteDoc(doc(db, "opportunities", id));
      setOpportunities(prev => prev.filter(opp => opp.id !== id));
      
      toast({
        title: "Success",
        description: "Opportunity deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to delete opportunity",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [isAuthenticated, user]);

  return {
    opportunities,
    loading,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    refetch: fetchOpportunities
  };
};
