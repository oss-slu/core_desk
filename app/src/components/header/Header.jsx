import React from "react";
import { useAuth } from "#useAuth";
import styles from "./Header.module.css";
import logo from "#coreDeskLogo";
import { Dropdown } from "tabler-react-2";
import { Icon } from "#icon";
const IconLogout = () => <Icon i={"logout"} size={18} />;
const IconLogin2 = () => <Icon i={"login-2"} size={18} />;

export const Header = () => {
  const { user, loggedIn, login, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.headerGroup}>
        <a href="/">
          <img src={logo} className={styles.headerLogo} alt="CoreDesk Logo" />
        </a>
      </div>
      <div className={styles.headerGroup}>
        <Dropdown
          prompt={loggedIn ? user?.firstName + " " + user?.lastName : "Account"}
          items={
            loggedIn
              ? [
                {
                  text: "Settings",
                  onclick: () => {
                    window.location.href = "/settings";
                  },
                  type: "item",
                  icon: <Icon i={"settings"} size={18} />,
                },
                {
                  text: "Feedback",
                  onclick: () => {
                    window.open("https://docs.google.com/forms/d/e/1FAIpQLSeuVXfyYgGUAIiZWXb9NA7JyG1OdWqdfY7lOGsfmQBboKwwMg/viewform?usp=dialog", "_blank");
                  },
                  type: "item",
                  icon: <Icon i={"message-circle"} size={18} />,
                },
                {
                  type: "divider",
                },
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
      </div>
    </header>
  );
};
