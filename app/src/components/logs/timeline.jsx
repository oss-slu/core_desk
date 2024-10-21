import React, { useEffect, useState } from "react";
import { Timeline } from "tabler-react-2/dist/timeline";
import { Icon } from "../../util/Icon";
import moment from "moment";
import Badge from "tabler-react-2/dist/badge";
import { Util } from "tabler-react-2";

const IconUserCreated = (size = 18) => <Icon i={"user-plus"} size={size} />;
const IconUserLogin = (size = 18) => <Icon i={"login-2"} size={size} />;
const IconUnhandled = (size = 18) => <Icon i={"alert-triangle"} size={size} />;
const IconShopCreated = (size = 18) => (
  <Icon i={"building-store"} size={size} />
);

const switchLogForContent = (log) => {
  switch (log.type) {
    case "USER_CREATED":
      return {
        icon: IconUserCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: "User Created",
        description: `User ${log.user.firstName} ${log.user.lastName} was created.`,
      };
    case "USER_LOGIN":
      return {
        icon: IconUserLogin,
        iconBgColor: "blue",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: "User Login",
        description: `User ${log.user.firstName} ${log.user.lastName} logged in.`,
      };
    case "SHOP_CREATED":
      return {
        icon: IconShopCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: "Shop Created",
        description: `Shop ${log.shop?.name || ""} was created.`,
      };
    default: {
      return {
        icon: IconUnhandled,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: "Unhandled",
        description: JSON.stringify(log),
      };
    }
  }
};

export const LogTimeline = ({ logs }) => {
  const [logTypes, setLogTypes] = useState([
    "USER_CREATED",
    "USER_LOGIN",
    "SHOP_CREATED",
  ]);
  const [activeLogTypes, setActiveLogTypes] = useState(
    new Set(["USER_CREATED", "SHOP_CREATED"])
  );

  const toggleLogType = (type) => {
    setActiveLogTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const filteredLogs = logs.filter((log) => activeLogTypes.has(log.type));

  return (
    <div>
      <label className={"text-secondary"}>Filter by log types</label>
      <Util.Row gap={1} wrap>
        {logTypes.map((type) => {
          const logContent = switchLogForContent({
            type,
            createdAt: new Date(),
            user: { firstName: "None", lastName: "None" },
          });

          return (
            <Badge
              key={type}
              color={logContent.iconBgColor}
              soft
              outline={activeLogTypes.has(type)}
              onClick={() => toggleLogType(type)}
              style={{ cursor: "pointer" }}
            >
              {logContent.icon({ size: 8 })} {logContent.title}
            </Badge>
          );
        })}
      </Util.Row>
      <Util.Spacer size={2} />
      {filteredLogs.length === 0 && (
        <i>No logs to display. Try modifying the filters above.</i>
      )}
      <Timeline
        events={filteredLogs.map((log) => ({
          ...switchLogForContent(log),
        }))}
      />
    </div>
  );
};
