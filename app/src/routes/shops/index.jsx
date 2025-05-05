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
  const { shops, loading } = useShops();
  const {
    createModalElement,
    createShop,
  } = useShops();

  if (loading) return <Loading />;

  return (
    <Page sidenavItems={sidenavItems("Shops", user.admin)}>
      <Util.Row justify="between" align="center">
        <div>
          <H1>Shops</H1>
        </div>
        <Button onClick={createShop}>Create Shop</Button>
        <Button onClick={deleteShop}>Delete Shop</Button>  {/* Add DeleteShop to UserShops*/} 
      </Util.Row>
      <Util.Spacer size={1} />
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))} 
      {createModalElement}
    </Page>
  );
};
