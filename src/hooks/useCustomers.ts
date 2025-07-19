
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

export interface Customer {
  id: string;
  name: string;
  company_id: string;
  position?: string;
  email?: string;
  phone?: string;
  user_id: string;
  created_at: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchCustomers = async () => {
    if (!isAuthenticated || !user) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, "customers"),
        where("user_id", "==", user.uid),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customer: Omit<Customer, "id" | "created_at" | "user_id">) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const docRef = await addDoc(collection(db, "customers"), {
        ...customer,
        user_id: user.uid,
        created_at: new Date().toISOString(),
      });
      const newCustomer = { ...customer, id: docRef.id, user_id: user.uid, created_at: new Date().toISOString() };
      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const docRef = doc(db, "customers", id);
      await updateDoc(docRef, updates);
      setCustomers((prev) => prev.map((cust) => (cust.id === id ? { ...cust, ...updates } : cust)));
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const docRef = doc(db, "customers", id);
      await deleteDoc(docRef);
      setCustomers((prev) => prev.filter((cust) => cust.id !== id));
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [user, isAuthenticated]);

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
};
