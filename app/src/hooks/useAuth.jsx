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
        body: JSON.stringify({ email, password }),
      });

      const data = await r.json();
      if (!r.ok) {
        throw new Error(data.error || "Login failed");
      }
      localStorage.setItem("token", data.token); //set token
    } catch (error) {
      console.error("Login error:", error.message);
    }
  };

  const sendPasswordResetEmail = async ({ email }) => { //sends email
    try {
      console.log("email", email);
      const r = await fetch(u("/api/auth/forgotPassword"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await r.json();
      if (!r.ok) {
        throw new Error(data.error);
      }
      toast.success(`Reset link sent to ${email}`); //this will do for now, but I am going to add more UI functionality later
    } catch (error) {
      console.error("Error sending email: ", error.message);
    }
  };

  const resetPassword = async ({ password }) => { //resets the password
    try {
      console.log("password", password);
      const r = await fetch(u("/api/auth/forgotPassword"), {
        method: "PUT",
        headers : {
          "Content-Type" : "application/json",
        },
        body : JSON.stringify({password}),
      });
      const data = await r.json();
      if (!r.ok){
        throw new Error(data.error);
      }


    }


    catch(error){
      console.error("Error resetting passsword" , error.message);
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
