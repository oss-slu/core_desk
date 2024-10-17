import React from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";

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
  return (
    <div>
      <Header />
      <div
        style={{
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingTop: "10px",
          maxWidth: 1200,
          margin: "auto",
        }}
      >
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </Router>
      </div>
    </div>
  );
};
