import React from "react";
import { Page } from "../../../../components/page/page";
import { shopSidenavItems } from "..";
import { Link, useParams } from "react-router-dom";
import { useShop, useAuth, useResources } from "../../../../hooks";
import { Typography, Util, Button, Card } from "tabler-react-2";
import { Loading } from "../../../../components/loading/loading";
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
      <Util.Row>
        {resources.map((resource) => (
          <Link
            to={`/shops/${shopId}/resources/${resource.id}`}
            key={resource.id}
          >
            <Card key={resource.id} title={resource.title}></Card>
          </Link>
        ))}
      </Util.Row>
    </Page>
  );
};
