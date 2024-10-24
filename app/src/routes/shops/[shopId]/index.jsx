import React, { useState } from "react";
import { Page, sidenavItems } from "../../../components/page/page";
import { useAuth } from "../../../hooks/useAuth";
import { Loading } from "../../../components/loading/loading";
import { Typography, Util } from "tabler-react-2";
import { UploadDropzone } from "../../../components/upload/uploader";
import { Icon } from "../../../util/Icon";
import { useParams } from "react-router-dom";
const { H1, H2 } = Typography;
import { useShop } from "../../../hooks/useShop";
import { Button } from "tabler-react-2/dist/button";
import { MarkdownRender } from "../../../components/markdown/MarkdownRender";
import { MarkdownEditor } from "../../../components/markdown/MarkdownEditor";
import { NotFound } from "../../../components/404/404";

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
        href: `/shops/${shopId}/3d-printing`,
        text: "3D Printing",
        active: activeText === "3D Printing",
        icon: <Icon i="printer" size={18} />,
      },
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
  const { shop, userShop, updateShop, opLoading } = useShop(shopId);
  const [editing, setEditing] = useState(false);
  const [newDescription, setNewDescription] = useState(shop?.description);

  if (loading)
    return (
      <Page sidenavItems={shopSidenavItems("Home", shopId, false)}>
        <Loading />
      </Page>
    );

  if (!shop) return <NotFound />;

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Home",
        shopId,
        user.admin,
        userShop.accountType
      )}
    >
      <Util.Row style={{ justifyContent: "space-between" }}>
        <H1>{shop.name}</H1>
        {user.admin || userShop.accountType === "ADMIN"
          ? !editing && (
              <Button onClick={() => setEditing(true)}>
                <Icon i="pencil" /> Edit Shop
              </Button>
            )
          : null}
      </Util.Row>
      <Util.Spacer size={1} />
      {editing ? (
        <>
          <Util.Row style={{ justifyContent: "space-between" }}>
            <H2>Editing shop description</H2>
            <Button
              onClick={async () => {
                console.log(newDescription);
                await updateShop({ description: newDescription });
                setEditing(false);
              }}
              loading={opLoading}
            >
              Save
            </Button>
          </Util.Row>
          <Util.Spacer size={1} />
          <MarkdownEditor
            value={shop.description || ""}
            onChange={(description) => {
              setNewDescription(description);
            }}
          />
        </>
      ) : (
        <>
          <MarkdownRender markdown={shop.description || ""} />
        </>
      )}
    </Page>
  );
};
