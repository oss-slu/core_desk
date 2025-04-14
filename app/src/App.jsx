import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Header } from "./components/header/Header";

import { Home } from "#home";
import { useAuth } from "useAuth";
import { Button } from "#button";
import { UsersPage } from "#usersPage";
import { UserPage } from "#usePage";
import { ShopPage } from "#shopPage";
import { Shops } from "#shops";
import { Jobs } from "#jobs";
import { JobPage } from "#jobPage";
import { Toaster } from "react-hot-toast";
import { ResourcesPage } from "#resourcesPage";
import { ResourcePage } from "#resourcePage";
import { NotFound } from "#notFound";
import { MaterialPage } from "#materialPage";
import { JobCostingPage } from "#jobCostingPage";
import { Billing } from "#billing";
import { ShopUsersPage } from "#shopUsersPage";
import { ShopUserPage } from "#shopUserPage";
import { BillingGroupsPage } from "#billingGroupsPage";
import { BillingGroupPage } from "#billingGroupPage";
import { BillingGroupInvitationPage } from "#billingGroupInvitationPage";
import { BillingGroupPortal } from "#billingGroupsPortal";

// eslint-disable-next-line
export default () => {
  const { loggedIn, loading, login, user } = useAuth();

  if (loading) return null;

  if (user && user.suspended) {
    return (
      <div>
        <Header />
        <div style={{ padding: "20px" }}>
          <h1>Your account has been suspended</h1>
          <p>{user.suspensionReason}</p>
        </div>
      </div>
    );
  }

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
            <Route
              path="/shops/:shopId/billing-groups/:groupId/invitations/:inviteId"
              element={<BillingGroupInvitationPage />}
            />
            {loggedIn ? (
              <>
                <Route path="/" element={<Home />} />

                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/:userId" element={<UserPage />} />

                <Route path="/shops" element={<Shops />} />
                <Route path="/shops/:shopId" element={<ShopPage />} />
                <Route path="/shops/:shopId/billing" element={<Billing />} />
                <Route
                  path="/shops/:shopId/users"
                  element={<ShopUsersPage />}
                />
                <Route
                  path="/shops/:shopId/users/:userId"
                  element={<ShopUserPage />}
                />
                <Route path="/shops/:shopId/jobs" element={<Jobs />} />
                <Route
                  path="/shops/:shopId/jobs/:jobId"
                  element={<JobPage />}
                />
                <Route
                  path="/shops/:shopId/jobs/:jobId/costing"
                  element={<JobCostingPage />}
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
                  path="/shops/:shopId/resources/type/:resourceTypeId/materials/:materialId"
                  element={<MaterialPage />}
                />
                <Route
                  path="/shops/:shopId/billing-groups"
                  element={<BillingGroupsPage />}
                />
                <Route
                  path="/shops/:shopId/billing-groups/:groupId"
                  element={<BillingGroupPage />}
                />
                <Route
                  path="/shops/:shopId/billing-groups/:groupId/portal"
                  element={<BillingGroupPortal />}
                />

                <Route path="*" element={<NotFound />} />
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
