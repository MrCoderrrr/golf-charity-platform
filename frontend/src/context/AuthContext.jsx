import { createContext, useContext, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return data;
    } catch (err) {
      // Re-throw so the calling component can show error toast
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", payload);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bootstrapAdmin = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/bootstrap-admin", payload);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      localStorage.setItem("adminKeyValid", "true");
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("adminKeyValid");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, bootstrapAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
