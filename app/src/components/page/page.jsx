import React from "react";
import { Sidenav } from "../sidenav/Sidenav";
import { Icon } from "../../util/Icon";
import { useAuth } from "../../hooks/useAuth";

export const sidenavItems = (activeText, userIsAdmin) => {
  const items = [
    {
      type: "item",
      href: `/`,
      text: `Home`,
      active: activeText === "Home",
      icon: <Icon i={"home"} size={18} />,
    },
    {
      type: "item",
      href: `/shops`,
      text: `Shops`,
      active: activeText === "Shops",
      icon: <Icon i="building-store" size={18} />,
    },
    {
      type: "item",
      href: `/jobs`,
      text: `Jobs`,
      active: activeText === "Jobs",
      icon: <Icon i="list-details" size={18} />,
    },
    {
      type: "divider",
    },
    {
      type: "item",
      href: `/notifications`,
      text: `Notifications`,
      active: activeText === "Notifications",
      icon: <Icon i="bell" size={18} />,
    },
    {
      type: "item",
      href: "/logs",
      text: "Logs",
      active: activeText === "Logs",
      icon: <Icon i="logs" size={18} />,
    },
  ];

  if (userIsAdmin) {
    items.push(
      {
        type: "divider",
      },
      {
        type: "item",
        href: `/users`,
        text: `Users`,
        active: activeText === "Users",
        icon: <Icon i="users" size={18} />,
      }
    );
  }

  return items;
};

export const Page = ({ children, sidenavItems: _sidenavItems }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        minHeight: "calc(100vh - 70px)",
        gap: 10,
      }}
    >
      <Sidenav items={_sidenavItems} />
      <div style={{ width: "100%", overflowX: "hidden" }}>{children}</div>
    </div>
  );
};
