import React from "react";
import { Page } from "../../../../components/page/page";
import { shopSidenavItems } from "..";
import { Link, useParams } from "react-router-dom";
import {
  useShop,
  useAuth,
  useResources,
  useResourceTypes,
  useMaterials,
} from "../../../../hooks";
import { Typography, Util, Button, Card } from "tabler-react-2";
import { Loading } from "../../../../components/loading/Loading";
import { Icon } from "../../../../util/Icon";
import { Table } from "#table";
import { Spinner } from "#spinner";
const { H1, H2, H3 } = Typography;

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

  const { ModalElement: CreateMaterialModalElement, createMaterial } =
    useMaterials(shopId);

  if (loading || resourceTypesLoading)
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Resources",
          shopId,
          user.admin,
          userShop.accountType,
          userShop.balance < 0
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
        userShop.accountType,
        userShop.balance < 0
      )}
    >
      <Util.Responsive threshold={600} justify="between" align="center">
        <H1>Resources</H1>
        {(user.admin || userShop.accountType === "ADMIN") && (
          <Util.Row gap={1} justify="start">
            <Button onClick={createResourceType}>
              <Icon i="tools" /> Add Resource Type
            </Button>
            {CreateResourceTypeModalElement}
            <Button onClick={createMaterial}>
              <Icon i="sandbox" /> Add Material
            </Button>
            {CreateMaterialModalElement}
            <Button onClick={createResource}>
              <Icon i="tool" /> Add Resource
            </Button>
            {CreateResourceModalElement}
          </Util.Row>
        )}
      </Util.Responsive>

      <Util.Spacer size={1} />

      <p>
        Resources are the tools and equipment that are available for use in the
        shop.
      </p>

      {resourceTypes.map((resourceType) => (
        <ResourceType
          key={resourceType.id}
          resourceType={resourceType}
          shopId={shopId}
          admin={user.admin || userShop.accountType === "ADMIN"}
        />
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

const ResourceType = ({ resourceType, shopId, admin }) => {
  const {
    materials,
    loading: materialsLoading,
    ModalElement: CreateMaterialModalElement,
    createMaterial,
  } = useMaterials(shopId, resourceType.id);
  const { ModalElement: CreateResourceModalElement, createResource } =
    useResources(shopId, resourceType.id);
  const { useEditResourceTypeModal } = useResourceTypes(shopId);
  const { 
    editModal: editResourceType, 
    editModalElement: EditResourceTypeModalElement
  } = useEditResourceTypeModal(resourceType.id, resourceType.title);

  return (
    <div>
      {CreateMaterialModalElement}
      {CreateResourceModalElement}
      <Util.Hr />
      <Util.Row justify="between">
        <H2 id={resourceType.id}>{resourceType.title}</H2>
        {admin && (
          <Util.Row gap={1}>
            <Button onClick={editResourceType}> 
              <Icon i="tools" /> Edit Resource Type
            </Button>
            {EditResourceTypeModalElement}
            <Button onClick={createMaterial}>
              <Icon i="sandbox" /> Add Material
            </Button>
            <Button onClick={createResource}>
              <Icon i="tool" /> Add Resource
            </Button>
          </Util.Row>
        )}
      </Util.Row>
      <Util.Spacer size={1} />
      <Util.Row gap={1} wrap>
        {resourceType.resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} shopId={shopId} />
        ))}
      </Util.Row>
      <Util.Spacer size={2} />
      <H3>Materials</H3>
      {materialsLoading ? (
        <Spinner />
      ) : materials.length === 0 ? (
        <i>
          No materials found. Click the "Add Material" button to add a new one.
        </i>
      ) : (
        <Table
          data={materials}
          columns={[
            {
              label: "Title",
              accessor: "title",
              render: (title, _) => (
                <Link
                  to={`/shops/${shopId}/resources/type/${resourceType.id}/materials/${_.id}`}
                >
                  {title}
                </Link>
              ),
            },
            {
              label: "Manufacturer",
              accessor: "manufacturer",
            },
            {
              label: "Cost Per Unit",
              accessor: "costPerUnit",
              render: (costPerUnit, _) =>
                _.costPublic
                  ? `$${costPerUnit}/${_.unitDescriptor}`
                  : "Not Public",
            },
            {
              label: "Created At",
              accessor: "createdAt",
              render: (createdAt) => new Date(createdAt).toLocaleString(),
            },
          ]}
        />
      )}
    </div>
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
