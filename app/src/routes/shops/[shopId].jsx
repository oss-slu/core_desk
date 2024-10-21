import React from "react";
import { Page, sidenavItems } from "../../components/page/page";
import { useAuth } from "../../hooks/useAuth";
import { Loading } from "../../components/loading/loading";
import { Typography } from "tabler-react-2";
import { UploadDropzone } from "../../components/upload/uploader";
const { H1 } = Typography;

export const ShopPage = () => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <Page sidenavItems={sidenavItems("Shops", false)}>
        <Loading />
      </Page>
    );

  return (
    <Page sidenavItems={sidenavItems("Shops", user?.admin)}>
      <H1>Shop</H1>
      <UploadDropzone />
    </Page>
  );
};
