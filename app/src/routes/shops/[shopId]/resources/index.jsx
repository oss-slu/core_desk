import React from "react";
import { Page } from "../../../../components/page/page";
import { shopSidenavItems } from "..";
import { Link, useParams } from "react-router-dom";
import { useShop, useAuth, useResources } from "../../../../hooks";
import { Typography, Util, Button, Card } from "tabler-react-2";
import { Loading } from "../../../../components/loading/loading";
import { Gallery } from "../../../../components/gallery/gallery";
const { H1 } = Typography;

export const ResourcesPage = () => {
  const { shopId } = useParams();
  const { user } = useAuth();
  const { userShop } = useShop(shopId);
  const { loading, resources, ModalElement, createResource } =
    useResources(shopId);

  if (loading)
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

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Resources",
        shopId,
        user.admin,
        userShop.accountType
      )}
    >
      <Util.Row
        style={{
          justifyContent: "space-between",
        }}
      >
        <H1>Resources</H1>
        {(user.admin || userShop.accountType === "ADMIN") && (
          <>
            <Button onClick={createResource}>Add Resource</Button>
            {ModalElement}
          </>
        )}
      </Util.Row>
      {resources.length === 0 && <i>No resources found.</i>}
      <Util.Spacer size={1} />
      <Util.Row gap={1} wrap>
        {resources.map((resource) => (
          <Link
            to={`/shops/${shopId}/resources/${resource.id}`}
            key={resource.id}
          >
            <Card
              key={resource.id}
              title={resource.title}
              style={{ width: 300 }}
            >
              {resource.images[0] ? (
                <img
                  src={resource.images[0].fileUrl}
                  style={{ width: "100%", height: 200, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    height: 200,
                    justifyContent: "center",
                    alignItems: "center",
                    display: "flex",
                  }}
                >
                  <i>No image found</i>
                </div>
              )}
            </Card>
          </Link>
        ))}
      </Util.Row>
    </Page>
  );
};
