import React from "react";
import { useAuth } from "#useAuth";
import { Loading } from "#loading";
import { Typography, Util } from "tabler-react-2";
import { Page, sidenavItems } from "#page";

const { H1 } = Typography;

export const SchedulingPage = () => {
  const { user: activeUser, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Page sidenavItems={sidenavItems("Shops", activeUser.admin)}>
      
    </Page>
    
  )


}
