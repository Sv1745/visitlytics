
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

export interface Company {
  id: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  logo?: string;
  user_id: string;
  created_at: string;
}

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchCompanies = async () => {
    if (!isAuthenticated || !user) {
      setCompanies([]);
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, "companies"),
        where("user_id", "==", user.uid),
        orderBy("name")
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCompany = async (company: Omit<Company, "id" | "created_at" | "user_id">) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const docRef = await addDoc(collection(db, "companies"), {
        ...company,
        user_id: user.uid,
        created_at: new Date().toISOString(),
      });
      const newCompany = { ...company, id: docRef.id, user_id: user.uid, created_at: new Date().toISOString() };
      setCompanies((prev) => [...prev, newCompany]);
      return newCompany;
    } catch (error) {
      console.error("Error adding company:", error);
      throw error;
    }
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const docRef = doc(db, "companies", id);
      await updateDoc(docRef, updates);
      setCompanies((prev) => prev.map((company) => (company.id === id ? { ...company, ...updates } : company)));
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  };

  const deleteCompany = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const docRef = doc(db, "companies", id);
      await deleteDoc(docRef);
      setCompanies((prev) => prev.filter((company) => company.id !== id));
    } catch (error) {
      console.error("Error deleting company:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanies();
    }
  }, [user, isAuthenticated]);

  return {
    companies,
    loading,
    addCompany,
    updateCompany,
    deleteCompany,
    refetch: fetchCompanies,
  };
};
