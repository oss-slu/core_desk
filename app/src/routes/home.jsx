import React from "react";
import { useAuth } from "#useAuth";
import { Loading } from "#loading";
import { Page, sidenavItems } from "#page";
import { MarkdownRender } from "#markdownRender";
import { useUser } from "../hooks/useUser";
import { Typography, Util } from "tabler-react-2";
import { ShopChooser } from "../components/shopChooser/ShopChooser";

const content = `
# Welcome to SLU Open Project!

## About

SLU Open Project is a tool built by a collaboration between the Saint Louis University Center for Additive Manufacturing and SLU Open Source.
It is a platform for managing and tracking jobs to be submitted to shops across the SLU community. It is designed to be a simple one-stop-shop
for shops to manage their workloads and to serve as a hub for users to submit jobs to these shops. Shops can receive jobs from single users, or from
billing groups of users that allow users to submit jobs to a shop, but to have their billing handled by a separate entity, like a department or lab.
`;

export const Home = () => {
  const { user: activeUser, loading } = useAuth();
  const { user } = useUser(activeUser?.id);

  if (loading) return <Loading />;

  if (user?.simple === false) {
    return (
      <Page sidenavItems={sidenavItems("Home", activeUser.admin)}>
        <MarkdownRender markdown={content} />
        <Util.Hr />
        {import.meta.env.VITE_HASH && import.meta.env.VITE_BUILD_DATE && (
          <Typography.Text>
            SLU Open Project / CoreDesk version {import.meta.env.VITE_HASH} built
            on {new Date(import.meta.env.VITE_BUILD_DATE).toLocaleString()}
          </Typography.Text>
        )}
      </Page>
    );
  } else {
    return (
      <div>
        <p>Step 1</p>
        <h1>Select a shop</h1>
        <ShopChooser/>
        <Util.Hr />
      </div>
    );
  }
};
