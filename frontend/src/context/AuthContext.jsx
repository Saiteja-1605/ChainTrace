import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("chaintrace_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getCurrentUser();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          localStorage.removeItem("chaintrace_token");
        }
      } catch (err) {
        console.warn("Session restore failed:", err.message);
        localStorage.removeItem("chaintrace_token");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem("chaintrace_token", res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.error || "Login failed");
  };

  const logout = () => {
    localStorage.removeItem("chaintrace_token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isManufacturer: user?.role === "manufacturer",
    isDistributor: user?.role === "distributor",
    isRetailer: user?.role === "retailer",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
