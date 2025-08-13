import React from "react";
import { Card, Typography } from "tabler-react-2";
const { H2 } = Typography;
import styles from "./ShopCard.module.css";
import { Link } from "react-router-dom";

const COLOR_PAIRS = (color = "blue") => {
  if (!color) {
    color = "blue";
  } else {
    color = color.toLowerCase();
  }

  const pairs = {
    blue: ["rgb(1, 61, 165)", "rgb(83, 195, 238)"],
    yellow: ["rgb(204, 153, 0)", "rgb(255, 223, 79)"],
    orange: ["rgb(204, 85, 0)", "rgb(255, 179, 102)"],
    red: ["rgb(165, 0, 30)", "rgb(238, 121, 132)"],
    teal: ["rgb(0, 102, 102)", "rgb(153, 221, 221)"],
    pink: ["rgb(165, 0, 81)", "rgb(238, 141, 179)"],
    purple: ["rgb(76, 0, 153)", "rgb(186, 149, 255)"],
    green: ["rgb(0, 102, 51)", "rgb(153, 221, 153)"],
  };

  return pairs[color] || pairs.blue;
};

export const ShopCard = ({ shop }) => {
  if (!shop) return null;

  const backgroundImage = shop.imageUrl
    ? `radial-gradient(at left top, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.3)), url(${shop.imageUrl})`
    : `radial-gradient(at left top, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.3)), linear-gradient(30deg, ${
        COLOR_PAIRS(shop.color)[0]
      }, ${COLOR_PAIRS(shop.color)[1]})`;

  return (
    <Link className={styles.shopCardlink} to={`/shops/${shop.id}`}>
      <Card style={{ backgroundImage }} className={styles.shopCard}>
        <H2>{shop.name}</H2>
      </Card>
    </Link>
  );
};
