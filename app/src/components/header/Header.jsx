import React from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Header.module.css";
import logo from "../../assets/slucam-logo-color.png";
import { Dropdown } from "tabler-react-2/dist/dropdown";
import { Icon } from "../../util/Icon";
const IconLogout = () => <Icon i={"logout"} size={18} />;
const IconLogin2 = () => <Icon i={"login-2"} size={18} />;

export const Header = () => {
  const { user, loggedIn, login, logout } = useAuth();

  return (
    <header className={styles.header}>
      <img src={logo} className={styles.headerLogo} alt="SLUCAM Logo" />
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
