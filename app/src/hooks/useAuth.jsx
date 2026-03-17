// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { u } from "#url";
import { emitter } from "../util/mitt";
import * as Sentry from "@sentry/react";
import toast from "react-hot-toast";

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
      localStorage.setItem("token", token);
      url.searchParams.delete("token");
      window.history.replaceState({}, document.title, url);
    }
  };

  const standardLogin = async ({ email, password }) => {
    try {
      const r = await fetch(u("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error);
      }
      localStorage.setItem("token", data.token); //set token
      fetchUser(); //should I fetchUser here? it works and directs to next page.
    } catch (error) {
      toast.error(error);
      console.error("Login error:", error.message);
    }
  };

  const sendPasswordResetEmail = async ({ email }) => {
    //sends email
    try {
      console.log("email", email);
      const r = await fetch(u("/api/auth/forgotPassword"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        // toast.error(data.error); we are not going to put up a toast, we just wont send an email if they dont exist in our db
        return;
      }
      toast.success(`Reset link sent to ${email}`);
    } catch (error) {
      toast.error(error);
      console.error("Error sending email: ", error.message);
      return;
    }
  };

  const resetPassword = async ({ newPassword, token }) => {
    try {
      const r = await fetch(u("/api/auth/forgotPassword"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword, token }),
      });

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      return true;
    } catch (err) {
      toast.error(err.message || "Something went wrong");
      throw err;
    }
  };

  const loginWithOkta = async () => {
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
      Sentry.setUser({
        id: user.id,
        email: user.email,
        name: user.firstName + " " + user.lastName,
        hasPassword: user.hasPassword,
      });
      console.log({
        id: user.id,
        email: user.email,
        name: user.firstName + " " + user.lastName,
        hasPassword: user.hasPassword, //debug
      });
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
    window.fetchUser = fetchUser;
    fetchUser();
  }, []);

  useEffect(() => {
    window.logout = logout;
    emitter.on("logout", () => {
      logout();
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        standardLogin,
        loginWithOkta,
        sendPasswordResetEmail,
        resetPassword,
        logout,
        loggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
