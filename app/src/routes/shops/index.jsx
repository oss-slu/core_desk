import React from "react";
import { useAuth } from "#useAuth";
import { useShops } from "../../hooks/useShops";
import { Loading } from "#loading";
import { Typography, Util } from "tabler-react-2";
import { ShopCard } from "../../components/shopcard/ShopCard";
import { Page, sidenavItems } from "#page";
import { Button } from "#button";

const { H1 } = Typography;

export const Shops = () => {
  const { user } = useAuth();
  const {
    shops, 
    loading,
    createModalElement,
    createShop
  } = useShops();
  const { user: activeUser } = useAuth();

  if (loading) return <Loading />;

  return (
    <Page sidenavItems={sidenavItems("Shops", user.admin)}>
      <Util.Row justify="between" align="center">
        <div>
          <H1>Shops</H1>
        </div>
        {activeUser.admin && (
          <Button onClick={createShop}>Create Shop</Button>
        )}
      </Util.Row>
      <Util.Spacer size={1} />
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))} 
      {createModalElement}
    </Page>
  );
};
