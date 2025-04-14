import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useShops } from "../../hooks/useShops";
import { Loading } from "../../components/loading/Loading";
import { Typography , Util} from "tabler-react-2";
import { ShopCard } from "../../components/shopcard/ShopCard";
import { Page, sidenavItems } from "../../components/page/page";
import { Button } from "tabler-react-2/dist/button";

const { H1 } = Typography;

export const Shops = () => {
  const { user } = useAuth();
  const { shops, loading } = useShops();
  const {
    ModalElement,
    createShop,
  } = useShops();

  if (loading) return <Loading />;

  return (
    <Page sidenavItems={sidenavItems("Shops", user.admin)}>
      <Util.Row justify="between" align="center">
        <div>
          <H1>Shops</H1>
        </div>
        <Button onClick={createShop}>Create Job</Button>
      </Util.Row>
      <Util.Spacer size={1} />
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))} 
      {ModalElement}
    </Page>
  );
};
