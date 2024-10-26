import React from "react";
import { Page } from "../../../../components/page/page";
import { shopSidenavItems } from "..";
import { Link, useParams } from "react-router-dom";
import {
  useShop,
  useAuth,
  useResources,
  useResourceTypes,
} from "../../../../hooks";
import { Typography, Util, Button, Card } from "tabler-react-2";
import { Loading } from "../../../../components/loading/loading";
import { Icon } from "../../../../util/Icon";
const { H1, H2 } = Typography;

export const ResourcesPage = () => {
  const { shopId } = useParams();
  const { user } = useAuth();
  const { userShop } = useShop(shopId);
  const {
    loading,
    ModalElement: CreateResourceModalElement,
    createResource,
  } = useResources(shopId);
  const {
    resourceTypes,
    loading: resourceTypesLoading,
    ModalElement: CreateResourceTypeModalElement,
    createResourceType,
  } = useResourceTypes(shopId);

  if (loading || resourceTypesLoading)
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
      <Util.Responsive threshold={600} justify="between">
        <H1>Resources</H1>
        {(user.admin || userShop.accountType === "ADMIN") && (
          <Util.Row gap={1} justify="start">
            <Button onClick={createResourceType}>
              <Icon i="tools" /> Add Resource Type
            </Button>
            {CreateResourceTypeModalElement}
            <Button onClick={createResource}>
              <Icon i="tool" /> Add Resource
            </Button>
            {CreateResourceModalElement}
          </Util.Row>
        )}
      </Util.Responsive>

      <p>
        Resources are the tools and equipment that are available for use in the
        shop.
      </p>

      {/* TABLE FORMAT */}
      {/* {resourceTypes.map((resourceType, i) => (
        <div key={resourceType.id}>
          {i !== 0 && <Util.Spacer size={3} />}
          <H2>{resourceType.title}</H2>
          <Table
            columns={[
              {
                label: "Image",
                accessor: "images",
                render: (images, _) => (
                  <img
                    src={images[0]?.fileUrl}
                    style={{ width: 100, height: 100, objectFit: "cover" }}
                  />
                ),
              },
              {
                label: "Resource",
                accessor: "title",
                render: (title, _) => (
                  <Link to={`/shops/${shopId}/resources/${_.id}`}>{title}</Link>
                ),
              },
            ]}
            data={resourceType.resources}
          />
        </div>
      ))} */}

      {resourceTypes.map((resourceType) => (
        <div key={resourceType.id}>
          <Util.Hr />
          <H2 id={resourceType.id}>{resourceType.title}</H2>
          <Util.Spacer size={1} />
          <Util.Row gap={1} wrap>
            {resourceType.resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                shopId={shopId}
              />
            ))}
          </Util.Row>
        </div>
      ))}

      {/* {resources.length === 0 && <i>No resources found.</i>}
      <Util.Spacer size={1} />
      <Util.Row gap={1} wrap>
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} shopId={shopId} />
        ))}
      </Util.Row> */}
    </Page>
  );
};

const ResourceCard = ({ resource, shopId }) => {
  return (
    <Link to={`/shops/${shopId}/resources/${resource.id}`} key={resource.id}>
      <Card key={resource.id} title={resource.title} style={{ width: 300 }}>
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
  );
};
