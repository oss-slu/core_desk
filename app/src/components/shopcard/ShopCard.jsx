import React from "react";
import { Card, Typography, Util } from "tabler-react-2";
const { H2 } = Typography;
import styles from "./ShopCard.module.css";
import { Link } from "react-router-dom";

export const ShopCard = ({ shop }) => {
  if (!shop) return null;

  const backgroundImage = shop.imageUrl
    ? `radial-gradient(at left top, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.3)), url(${shop.imageUrl})`
    : `radial-gradient(at left top, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.3)), linear-gradient(30deg, rgb(1 61 165), rgb(83 195 238))`;

  return (
    <Link className={styles.shopCardlink} to={`/shop/${shop.id}`}>
      <Card style={{ backgroundImage }} className={styles.shopCard}>
        <H2>{shop.name}</H2>
      </Card>
    </Link>
  );
};
