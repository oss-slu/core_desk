import React from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const Home = () => {
  const { user } = useAuth();

  return (
    <>
      <h1>Welcome to React Vite Micro App!</h1>
      <p>Hard to get more minimal than this React app.</p>
      {JSON.stringify(user)}
    </>
  );
};

export default () => {
  const { user, login, loggedIn, logout } = useAuth();

  return (
    <div>
      {loggedIn ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={login}>Login</button>
      )}
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </div>
  );
};
