import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Header } from "./components/header/Header";

import { Home } from "./routes/home";
import { useAuth } from "./hooks/useAuth";
import { Button } from "tabler-react-2/dist/button";
import { UsersPage } from "./routes/users";
import { UserPage } from "./routes/users/[userId]";

export default () => {
  const { user, loggedIn, loading, login } = useAuth();

  if (loading) return null;

  return (
    <div>
      <Header />
      <div
        style={{
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingTop: "10px",
          maxWidth: 1400,
          margin: "auto",
        }}
      >
        <Router>
          <Routes>
            {loggedIn ? (
              <>
                <Route path="/" element={<Home />} />

                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/:userId" element={<UserPage />} />
              </>
            ) : (
              <Route
                path="*"
                element={
                  <div>
                    <h1>Welcome to SLU Open Project</h1>
                    <p>Please log in to continue</p>
                    <Button variant="primary" onClick={login}>
                      Login
                    </Button>
                  </div>
                }
              />
            )}
          </Routes>
        </Router>
      </div>
    </div>
  );
};
