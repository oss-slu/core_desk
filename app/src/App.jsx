import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Header } from "./components/header/Header";

import { Home } from "./routes/home";
import { useAuth } from "./hooks/useAuth";
import { Button } from "tabler-react-2/dist/button";
import { UsersPage } from "./routes/users";
import { UserPage } from "./routes/users/[userId]";
import { ShopPage } from "./routes/shops/[shopId]/index";
import { Shops } from "./routes/shops";
import { Jobs } from "./routes/shops/[shopId]/jobs";
import { JobPage } from "./routes/shops/[shopId]/jobs/[jobId]";
import { Toaster } from "react-hot-toast";
import { ResourcesPage } from "./routes/shops/[shopId]/resources";
import { ResourcePage } from "./routes/shops/[shopId]/resources/[resourceId]";
import { Printing3d } from "./routes/shops/[shopId]/3d-printing";

export default () => {
  const { user, loggedIn, loading, login } = useAuth();

  if (loading) return null;

  return (
    <div>
      <Toaster />
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

                <Route path="/shops" element={<Shops />} />
                <Route path="/shops/:shopId" element={<ShopPage />} />
                <Route path="/shops/:shopId/jobs" element={<Jobs />} />
                <Route
                  path="/shops/:shopId/jobs/:jobId"
                  element={<JobPage />}
                />
                <Route
                  path="/shops/:shopId/resources"
                  element={<ResourcesPage />}
                />
                <Route
                  path="/shops/:shopId/resources/:resourceId"
                  element={<ResourcePage />}
                />
                <Route
                  path="/shops/:shopId/3d-printing"
                  element={<Printing3d />}
                />
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
