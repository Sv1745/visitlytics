
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

export interface Requirement {
  id: string;
  company_id: string;
  customer_id: string;
  equipment_name: string;
  required_period: string;
  status: string;
  notes?: string;
  recorded_date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useRequirements = () => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchRequirements = async () => {
    if (!isAuthenticated || !user) {
      setRequirements([]);
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, "requirements"),
        where("user_id", "==", user.uid),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Requirement));
      setRequirements(data);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      toast({
        title: "Error",
        description: "Failed to fetch requirements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = async (requirement: Omit<Requirement, "id" | "created_at" | "updated_at" | "user_id">) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, "requirements"), {
        ...requirement,
        user_id: user.uid,
        created_at: now,
        updated_at: now,
      });
      const newRequirement = { ...requirement, id: docRef.id, user_id: user.uid, created_at: now, updated_at: now };
      setRequirements((prev) => [newRequirement, ...prev]);
      return newRequirement;
    } catch (error) {
      console.error("Error adding requirement:", error);
      throw error;
    }
  };

  const updateRequirement = async (id: string, updates: Partial<Requirement>) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const docRef = doc(db, "requirements", id);
      const now = new Date().toISOString();
      await updateDoc(docRef, { ...updates, updated_at: now });
      setRequirements((prev) => prev.map((req) => (req.id === id ? { ...req, ...updates, updated_at: now } : req)));
    } catch (error) {
      console.error("Error updating requirement:", error);
      throw error;
    }
  };

  const deleteRequirement = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const docRef = doc(db, "requirements", id);
      await deleteDoc(docRef);
      setRequirements((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error("Error deleting requirement:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequirements();
    }
  }, [user, isAuthenticated]);

  return {
    requirements,
    loading,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    refreshRequirements: fetchRequirements,
  };
};
