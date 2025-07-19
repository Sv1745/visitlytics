
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

export interface Visit {
  id: string;
  company_id: string;
  customer_id: string;
  action_type: string;
  visit_date: string;
  notes?: string;
  next_follow_up?: string | null;
  next_action_type?: string | null;
  status: string;
  user_id: string;
  created_at: string;
}

export const useVisits = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchVisits = async () => {
    if (!isAuthenticated || !user) {
      setVisits([]);
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, "visits"),
        where("user_id", "==", user.uid),
        orderBy("visit_date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Visit));
      setVisits(data);
    } catch (error) {
      console.error("Error fetching visits:", error);
      toast({
        title: "Error",
        description: "Failed to load visits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addVisit = async (visit: Omit<Visit, "id" | "created_at" | "user_id">) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, "visits"), {
        ...visit,
        user_id: user.uid,
        created_at: now,
      });
      const newVisit = { ...visit, id: docRef.id, user_id: user.uid, created_at: now };
      setVisits((prev) => [newVisit, ...prev]);
      return newVisit;
    } catch (error) {
      console.error("Error adding visit:", error);
      toast({
        title: "Error",
        description: "Failed to add visit",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateVisit = async (id: string, updates: Partial<Visit>) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const docRef = doc(db, "visits", id);
      await updateDoc(docRef, updates);
      setVisits((prev) => prev.map((visit) => (visit.id === id ? { ...visit, ...updates } : visit)));
    } catch (error) {
      console.error("Error updating visit:", error);
      toast({
        title: "Error",
        description: "Failed to update visit",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteVisit = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const docRef = doc(db, "visits", id);
      await deleteDoc(docRef);
      setVisits((prev) => prev.filter((visit) => visit.id !== id));
    } catch (error) {
      console.error("Error deleting visit:", error);
      toast({
        title: "Error",
        description: "Failed to delete visit",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchVisits();
    }
  }, [user, isAuthenticated]);

  return {
    visits,
    loading,
    addVisit,
    updateVisit,
    deleteVisit,
    refetch: fetchVisits,
  };
};
