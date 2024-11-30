import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Loading } from "../components/loading/Loading";
import { Page, sidenavItems } from "../components/page/page";
import { MarkdownRender } from "../components/markdown/MarkdownRender";

const content = `
# Welcome to SLU Open Project!

## About

SLU Open Project is a tool built by a collaboration between the Saint Louis University Center for Additive Manufacturing and SLU Open Source.
It is a platform for managing and tracking jobs to be submitted to shops across the SLU community. It is designed to be a simple one-stop-shop
for shops to manage their workloads and to serve as a hub for users to submit jobs to these shops. Shops can recieve jobs from single users, or from
billing groups of users that allow users to submit jobs to a shop, but to have their billing handled by a separate entity, like a department or lab.
`;

export const Home = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Page sidenavItems={sidenavItems("Home", user.admin)}>
      <MarkdownRender markdown={content} />
    </Page>
  );
};
