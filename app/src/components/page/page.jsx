import React from "react";
import { Sidenav } from "../sidenav/Sidenav";
import { Icon } from "../../util/Icon";
import { useAuth } from "../../hooks/useAuth";

const sidenavItems = (activeText, userIsAdmin) => [
  {
    type: "item",
    href: `/`,
    text: `Home`,
    active: activeText === "Home",
    icon: <Icon i={"home"} size={18} />,
  },
  // {
  //   type: "item",
  //   href: `/shops`,
  //   text: `Shops`,
  //   active: activeText === "Shops",
  //   icon: <IconBuildingStore size={18} />,
  // },
  // {
  //   type: "item",
  //   href: `/jobs`,
  //   text: `Jobs`,
  //   active: activeText === "Jobs",
  //   icon: <IconListDetails size={18} />,
  // },
  // {
  //   type: "divider",
  // },
  // {
  //   type: "item",
  //   href: `/notifications`,
  //   text: `Notifications`,
  //   active: activeText === "Notifications",
  //   icon: <IconBell size={18} />,
  // },
  // {
  //   type: "item",
  //   href: "/logs",
  //   text: "Logs",
  //   active: activeText === "Logs",
  //   icon: <IconLogs size={18} />,
  // },
  // ...(userIsAdmin
  //   ? [
  //       {
  //         type: "divider",
  //       },
  //       {
  //         type: "item",
  //         href: `/users`,
  //         text: `Users`,
  //         active: activeText === "Users",
  //         icon: <IconUsers size={18} />,
  //       },
  //     ]
  //   : []),
];

export const Page = ({ children }) => {
  const { user } = useAuth();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        minHeight: "calc(100vh - 100px)",
        gap: 10,
      }}
    >
      <Sidenav items={sidenavItems("Home")} userIsAdmin={user.admin} />
      <div>{children}</div>
    </div>
  );
};
