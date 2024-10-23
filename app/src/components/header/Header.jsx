import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Header.module.css";
import logo from "../../assets/slucam-logo-color.png";
import { Dropdown } from "tabler-react-2/dist/dropdown";
import { Icon } from "../../util/Icon";
import { useShop } from "../../hooks/index";
const IconLogout = () => <Icon i={"logout"} size={18} />;
const IconLogin2 = () => <Icon i={"login-2"} size={18} />;

export const Header = () => {
  const { user, loggedIn, login, logout } = useAuth();
  const [shopId, setShopId] = useState("");

  useEffect(() => {
    setInterval(() => {
      const _shopId = document.location.href.match(/\/shops\/([a-z0-9]+)/)?.[1];
      if (_shopId !== shopId) setShopId(_shopId);
    }, 1000);
  }, []);

  const { shop } = useShop(shopId);

  return (
    <header className={styles.header}>
      <div className={styles.headerGroup}>
        <img src={logo} className={styles.headerLogo} alt="SLUCAM Logo" />
        <h1 className={styles.headerTitle}>{shop?.name}</h1>
      </div>
      <Dropdown
        prompt={loggedIn ? user?.firstName + " " + user?.lastName : "Account"}
        items={
          loggedIn
            ? [
                {
                  text: "Log Out",
                  onclick: logout,
                  type: "item",
                  icon: <IconLogout />,
                },
              ]
            : [
                {
                  text: "Log In",
                  onclick: login,
                  type: "item",
                  icon: <IconLogin2 />,
                },
              ]
        }
      />
    </header>
  );
};
