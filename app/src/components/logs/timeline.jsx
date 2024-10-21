import React, { useEffect, useState } from "react";
import { Timeline } from "tabler-react-2/dist/timeline";
import { Icon } from "../../util/Icon";
import moment from "moment";
import Badge from "tabler-react-2/dist/badge";
import { Util } from "tabler-react-2";

const IconUserCreated = ({ size = 18 }) => <Icon i={"user-plus"} size={size} />;
const IconUserLogin = ({ size = 18 }) => <Icon i={"login-2"} size={size} />;
const IconUnhandled = ({ size = 18 }) => (
  <Icon i={"alert-triangle"} size={size} />
);
const IconShopCreated = ({ size = 18 }) => (
  <Icon i={"building-store"} size={size} />
);
const IconUserConnectedToShop = ({ size = 18 }) => (
  <Icon i={"plug-connected"} size={size} />
);
const IconUserDisconnectedFromShop = ({ size = 18 }) => (
  <Icon i={"plug-connected-x"} size={size} />
);
const IconUserShopRoleChanged = ({ size = 18 }) => (
  <Icon i={"mobiledata"} size={size} />
);
const IconUserPromotedToAdmin = ({ size = 18 }) => (
  <Icon i={"user-up"} size={size} />
);
const IconUserDemotedFromAdmin = ({ size = 18 }) => (
  <Icon i={"user-down"} size={size} />
);
const IconUserSuspensionApplied = ({ size = 18 }) => (
  <Icon i={"ban"} size={size} />
);
const IconUserSuspensionRemoved = ({ size = 18 }) => (
  <Icon i={"circle-dashed-check"} size={size} />
);
const IconUserSuspensionChanged = ({ size = 18 }) => (
  <Icon i={"pencil"} size={size} />
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
    case "USER_CONNECTED_TO_SHOP":
      return {
        icon: IconUserConnectedToShop,
        iconBgColor: "teal",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Connected to Shop`,
        description: `User ${log.user.firstName} ${
          log.user.lastName
        } was connected to shop ${log.shop?.name} as a ${
          log.to ? JSON.parse(log.to)?.accountType?.toLowerCase() : "..."
        }.`,
      };
    case "USER_DISCONNECTED_FROM_SHOP":
      return {
        icon: IconUserDisconnectedFromShop,
        iconBgColor: "pink",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Disconnected from Shop`,
        description: `User ${log.user.firstName} ${log.user.lastName} was disconnected from shop ${log.shop?.name}.`,
      };
    case "USER_SHOP_ROLE_CHANGED":
      return {
        icon: IconUserShopRoleChanged,
        iconBgColor: "purple",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Shop Role Changed`,
        description: `User ${log.user.firstName} ${
          log.user.lastName
        } role was changed to ${
          log.to ? JSON.parse(log.to).accountType : "..."
        }.`,
      };
    case "USER_PROMOTED_TO_ADMIN":
      return {
        icon: IconUserPromotedToAdmin,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Promoted to Admin`,
        description: `User ${log.user.firstName} ${log.user.lastName} was promoted to admin.`,
      };
    case "USER_DEMOTED_FROM_ADMIN":
      return {
        icon: IconUserDemotedFromAdmin,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Demoted from Admin`,
        description: `User ${log.user.firstName} ${log.user.lastName} was demoted from admin.`,
      };
    case "USER_SUSPENSION_APPLIED":
      return {
        icon: IconUserSuspensionApplied,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Suspension Applied`,
        description: `User ${log.user.firstName} ${
          log.user.lastName
        } was suspended with reason "${JSON.parse(log.to || "{}")?.reason}".`,
      };
    case "USER_SUSPENSION_REMOVED":
      return {
        icon: IconUserSuspensionRemoved,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Suspension Removed`,
        description: `User ${log.user.firstName} ${log.user.lastName} was unsuspended.`,
      };
    case "USER_SUSPENSION_CHANGED":
      return {
        icon: IconUserSuspensionChanged,
        iconBgColor: "yellow",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Suspension Changed`,
        description: `User ${log.user.firstName} ${
          log.user.lastName
        }'s suspension was changed from "${
          JSON.parse(log.to || "{}")?.reason
        }" to "${JSON.parse(log.to || "{}")?.reason}".`,
      };

    default: {
      return {
        icon: IconUnhandled,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Unhandled ${log.type}`,
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
    "USER_CONNECTED_TO_SHOP",
    "USER_DISCONNECTED_FROM_SHOP",
    "USER_SHOP_ROLE_CHANGED",
    "USER_PROMOTED_TO_ADMIN",
    "USER_DEMOTED_FROM_ADMIN",
    "USER_SUSPENSION_APPLIED",
    "USER_SUSPENSION_REMOVED",
    "USER_SUSPENSION_CHANGED",
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
              {logContent.icon({ size: 12 })} {logContent.title}
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
