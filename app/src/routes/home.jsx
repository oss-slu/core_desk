import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useShops } from "../hooks/useShops";
import { Loading } from "../components/loading/loading";
import { Typography } from "tabler-react-2";
import { ShopCard } from "../components/shopcard/ShopCard";
const { H1 } = Typography;

export const Home = () => {
  const { user } = useAuth();
  const { shops, loading } = useShops();

  if (loading) return <Loading />;

  return (
    <>
      <H1>Shops</H1>
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </>
  );
};
