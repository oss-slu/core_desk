import React from "react";
import { Link } from "react-router-dom";
import styles from "./sidenav.module.css";
import { Button } from "tabler-react-2/dist/button";
import { Util } from "tabler-react-2";

export const Sidenav = ({ items }) => {
  const IconComponent = ({ icon }) => {
    if (icon) {
      return icon;
    }
    return null;
  };

  return (
    <nav className={styles.sidenav}>
      {items.map((item, index) =>
        item.type === "divider" ? (
          <Util.Hr key={index} />
        ) : (
          <Button
            href={item.href}
            variant={item.active && "primary"}
            outline={item.active}
          >
            <Util.Row gap={1}>
              {item.icon && item.icon}
              {item.text}
            </Util.Row>
          </Button>
        )
      )}
    </nav>
  );
};
