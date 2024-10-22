import React from "react";
import { Page } from "../../../../components/page/page";
import { shopSidenavItems } from "..";
import { useParams } from "react-router-dom";
import { useAuth, useResource, useShop } from "../../../../hooks";
import { Loading } from "../../../../components/loading/loading";
import { Typography, Util } from "tabler-react-2";
import { Gallery } from "../../../../components/gallery/gallery";
import { UploadDropzone } from "../../../../components/upload/uploader";
const { H1, H3 } = Typography;

export const ResourcePage = () => {
  const { shopId, resourceId } = useParams();
  const { user } = useAuth();
  const { userShop } = useShop(shopId);
  const { resource, loading } = useResource(shopId, resourceId);

  if (loading) {
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Resources",
          shopId,
          user.admin,
          userShop.accountType
        )}
      >
        <Loading />
      </Page>
    );
  }

  const HereUploadDropzone = () => (
    <UploadDropzone
      scope="shop.resource.image"
      metadata={{
        shopId,
        resourceId,
      }}
      dropzoneAppearance={{
        container: {
          height: "100%",
          padding: 10,
        },
        uploadIcon: {
          display: "none",
        },
      }}
    />
  );

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Resources",
        shopId,
        user.admin,
        userShop.accountType
      )}
    >
      <Util.Row gap={1}>
        <div style={{ width: "50%" }}>
          <H1>{resource.title}</H1>
          {/* {JSON.stringify(resource)} */}
        </div>
        <div style={{ width: "50%" }}>
          <H3>Gallery</H3>
          <div
            style={{
              width: "100%",
              height: 200,
            }}
          >
            {resource.images.length > 0 ? (
              <div
                style={{
                  border: "1px solid #e5e5e5",
                }}
              >
                <Gallery
                  images={resource.images}
                  height={200}
                  lastSlide={
                    <div style={{ padding: 8 }}>
                      <HereUploadDropzone />
                    </div>
                  }
                />
              </div>
            ) : (
              <HereUploadDropzone />
            )}
          </div>
        </div>
      </Util.Row>
    </Page>
  );
};
