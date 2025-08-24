import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

console.log("AuthContext loading...");

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log("AuthProvider rendering...");

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onAuthChange, setOnAuthChange] = useState(null);

  // Configure axios defaults
  axios.defaults.baseURL = "http://localhost:5000/api";
  axios.defaults.withCredentials = true; // Important for cookies

  // Check if user is already authenticated on app load
  useEffect(() => {
    console.log("AuthProvider useEffect running...");
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...");
        const response = await axios.get("/auth/me");
        console.log("Auth check response:", response.data);
        setUser(response.data);
        setIsAuthenticated(true);
        // Trigger auth change callback if exists
        if (onAuthChange) onAuthChange();
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [onAuthChange]);

  const login = async (email, password) => {
    try {
      await axios.post("/auth/login", { email, password });
      const response = await axios.get("/auth/me");
      setUser(response.data);
      setIsAuthenticated(true);
      // Trigger auth change callback if exists
      if (onAuthChange) onAuthChange();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (firstName, lastName, email, password) => {
    try {
      await axios.post("/auth/register", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      const response = await axios.get("/auth/me");
      setUser(response.data);
      setIsAuthenticated(true);
      // Trigger auth change callback if exists
      if (onAuthChange) onAuthChange();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Trigger auth change callback if exists
      if (onAuthChange) onAuthChange();
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    setOnAuthChange,
  };

  console.log("AuthProvider value:", value);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
