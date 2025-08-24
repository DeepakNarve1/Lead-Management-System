import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext.js";

const LeadContext = createContext();

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error("useLeads must be used within a LeadProvider");
  }
  return context;
};

export const LeadProvider = ({ children }) => {
  const { isAuthenticated, setOnAuthChange } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
  });

  // Calculate statistics from leads
  const calculateStats = (leadsData) => {
    const totalLeads = leadsData.length;
    const newLeads = leadsData.filter((lead) => lead.status === "new").length;
    const contactedLeads = leadsData.filter(
      (lead) => lead.status === "contacted"
    ).length;
    const qualifiedLeads = leadsData.filter(
      (lead) => lead.status === "qualified"
    ).length;
    const wonLeads = leadsData.filter((lead) => lead.status === "won").length;
    const lostLeads = leadsData.filter((lead) => lead.status === "lost").length;

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      wonLeads,
      lostLeads,
    };
  };

  // Fetch all leads
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/leads?limit=1000");
      const leadsData = response.data.data || response.data;
      setLeads(leadsData);

      // Calculate and update statistics
      const newStats = calculateStats(leadsData);
      setStats(newStats);

      console.log("Leads fetched:", leadsData.length);
      console.log("Stats updated:", newStats);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh leads and stats
  const refreshLeads = () => {
    fetchLeads();
  };

  // Set up auth change callback to refresh leads
  useEffect(() => {
    if (setOnAuthChange) {
      setOnAuthChange(() => {
        console.log("Auth changed, refreshing leads...");
        if (isAuthenticated) {
          fetchLeads();
        } else {
          // Clear leads when user logs out
          setLeads([]);
          setStats({
            totalLeads: 0,
            newLeads: 0,
            contactedLeads: 0,
            qualifiedLeads: 0,
            wonLeads: 0,
            lostLeads: 0,
          });
        }
      });
    }
  }, [setOnAuthChange, isAuthenticated]);

  // Initial fetch when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
    }
  }, [isAuthenticated]);

  const value = {
    leads,
    stats,
    loading,
    refreshLeads,
    calculateStats,
  };

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>;
};
