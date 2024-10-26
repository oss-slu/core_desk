import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Loading } from "../components/loading/loading";
import { Typography } from "tabler-react-2";
import { Page, sidenavItems } from "../components/page/page";
const { H1 } = Typography;

export const Home = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Page sidenavItems={sidenavItems("Home", user.admin)}>
      <H1>Home</H1>
    </Page>
  );
};
