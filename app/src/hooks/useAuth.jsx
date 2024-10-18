// AuthContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { u } from "../util/url";

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const getToken = () => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      console.log("Setting token", token);
      url.searchParams.delete("token");
      window.history.replaceState({}, document.title, url);
    }
  };

  const login = async () => {
    const r = await fetch(u("/api/auth/login"));
    const { url } = await r.json();
    window.location.href = url + "?RelayState=" + window.location.href;
  };

  const fetchUser = async () => {
    getToken();

    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setLoggedIn(false);
      setUser(null);
      return;
    }

    const r = await fetch(u("/api/auth/me"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (r.ok) {
      const { user } = await r.json();
      setUser(user);
      setLoggedIn(true);
      setLoading(false);
    }

    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setLoggedIn(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
