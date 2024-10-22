import React from "react";
import { Page, sidenavItems } from "../../../components/page/page";
import { useAuth } from "../../../hooks/useAuth";
import { Loading } from "../../../components/loading/loading";
import { Typography } from "tabler-react-2";
import { UploadDropzone } from "../../../components/upload/uploader";
import { Icon } from "../../../util/Icon";
import { useParams } from "react-router-dom";
const { H1 } = Typography;
import { useShop } from "../../../hooks/useShop";

export const shopSidenavItems = (
  activeText,
  shopId,
  isGlobalAdmin,
  accountType
) => {
  const items = [
    {
      type: "item",
      href: `/shops`,
      text: `Back to shops`,
      icon: <Icon i="arrow-left" size={18} />,
    },
    {
      type: "divider",
    },
    {
      type: "item",
      text: "Shop Home",
      active: activeText === "Home",
      href: `/shops/${shopId}`,
      icon: <Icon i="building-store" size={18} />,
    },
    {
      type: "item",
      text: "Jobs",
      active: activeText === "Jobs",
      href: `/shops/${shopId}/jobs`,
      icon: <Icon i="robot" size={18} />,
    },
    {
      type: "item",
      text: "Billing",
      active: activeText === "Billing",
      href: `/shops/${shopId}/billing`,
      icon: <Icon i="credit-card" size={18} />,
    },
    {
      type: "item",
      text: "Resources",
      active: activeText === "Resources",
      href: `/shops/${shopId}/resources`,
      icon: <Icon i="brand-databricks" size={18} />,
    },
  ];

  if (accountType !== "CUSTOMER" || isGlobalAdmin) {
    items.push({
      type: "divider",
    });
  }

  if (accountType === "ADMIN" || accountType === "OPERATOR" || isGlobalAdmin) {
    items.push({
      type: "item",
      href: `/shops/${shopId}/tasks`,
      text: "Tasks",
      active: activeText === "Tasks",
      icon: <Icon i="box" size={18} />,
    });
  }

  if (
    accountType === "ADMIN" ||
    accountType === "OPERATOR" ||
    accountType === "INSTRUCTOR" ||
    isGlobalAdmin
  ) {
    items.push({
      type: "item",
      href: `/shops/${shopId}/billing-groups`,
      text: "Billing Groups",
      active: activeText === "Billing Groups",
      icon: <Icon i="school" size={18} />,
    });
  }

  if (accountType === "ADMIN" || isGlobalAdmin) {
    items.push(
      {
        type: "item",
        href: `/shops/${shopId}/users`,
        text: "Users",
        active: activeText === "Users",
        icon: <Icon i="users-group" size={18} />,
      },
      {
        type: "item",
        text: "Settings",
        active: activeText === "Settings",
        href: `/shops/${shopId}/settings`,
        icon: <Icon i="settings" size={18} />,
      }
    );
  }

  return items;
};

export const ShopPage = () => {
  const { user, loading } = useAuth();
  const { shopId } = useParams();
  const { shop, userShop } = useShop(shopId);

  if (loading)
    return (
      <Page sidenavItems={shopSidenavItems("Shops", shopId, false)}>
        <Loading />
      </Page>
    );

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Shops",
        shopId,
        user.admin,
        userShop.accountType
      )}
    >
      <H1>Shop</H1>
      {userShop.accountType}
      <UploadDropzone />
    </Page>
  );
};
