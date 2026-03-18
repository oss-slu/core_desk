import React from "react";
import { Page } from "#page";
import { shopSidenavItems } from "..";
import { Link, useParams } from "react-router-dom";
import {
  useShop,
  useAuth,
  useResources,
  useResourceTypes,
  useMaterials,
  useUser,
} from "#hooks";
import { Typography, Util, Button, Card, useConfirm, Dropdown } from "tabler-react-2";
import { Loading } from "#loading";
import { Icon } from "#icon";
import { Table } from "#table";
import { Spinner } from "#spinner";
import { NotFound } from "../../../../components/404/404";
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
  const { user: activeUser } = useUser(user?.id);

  const {
    resourceTypes,
    loading: resourceTypesLoading,
    createModalElement: CreateResourceTypeModalElement,
    createResourceType,
    deleteResourceType,
  } = useResourceTypes(shopId);

  const { ModalElement: CreateMaterialModalElement, createMaterial } =
    useMaterials(shopId);

  const equipmentItems = [
    { label: <p style={{marginTop: 2, marginBottom: 2}} onClick={createResource}><Icon i="tool" /> Add Resource</p> },
    { label: <p style={{marginTop: 2, marginBottom: 2}} onClick={createResourceType}><Icon i="tools" /> Add Resource Type</p> },
    { label: <p style={{marginTop: 2, marginBottom: 2}} onClick={createMaterial}><Icon i="sandbox" /> Add Material</p> },
  ];

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

  if (activeUser?.simple === true) return <NotFound />;

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
          <Dropdown 
            prompt="Add Equipment"
            items={equipmentItems.map((item) => ({
              type: "item",
              text: item.label,
            }))}
          />
        )}
        {CreateResourceTypeModalElement}
        {CreateMaterialModalElement}
        {CreateResourceModalElement}
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
          onDelete={deleteResourceType}
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

const ResourceType = ({ resourceType, shopId, admin, onDelete }) => {
  const {
    materials,
    loading: materialsLoading,
    ModalElement: CreateMaterialModalElement,
    createMaterial,
  } = useMaterials(shopId, resourceType.id);
  const { ModalElement: CreateResourceModalElement, createResource } =
    useResources(shopId, resourceType.id);

  const { confirm, ConfirmModal } = useConfirm({
    title: "Are you sure you want to delete this resource type?",
    text: "This action cannot be undone.",
    commitText: "Delete",
    cancelText: "Cancel",
  });

  const { useEditResourceTypeModal } = useResourceTypes(shopId);
  const {
    editModal: editResourceType,
    editModalElement: EditResourceTypeModalElement,
  } = useEditResourceTypeModal(
    resourceType.id,
    resourceType.title,
    resourceType.costingMode
  );

  const resourceItems = [
    { label: <p style={{marginTop: 2, marginBottom: 2}} onClick={editResourceType}><Icon i="tools" /> Edit Resource Type</p> },
    { label: <p style={{marginTop: 2, marginBottom: 2}} onClick={createMaterial}><Icon i="sandbox" /> Add Material</p> },
    { label: <p style={{marginTop: 2, marginBottom: 2}} onClick={createResource}><Icon i="tool" /> Add Resource</p> },
    { label: <p style={{marginTop: 2, marginBottom: 2}} onClick={async () => {
      if (await confirm()) onDelete(resourceType.id);
    }}><Icon i="trash" /> Delete Resource Type</p> }
  ];

  return (
    <div>
      {CreateMaterialModalElement}
      {CreateResourceModalElement}
      {ConfirmModal}
      <Util.Hr />
      <Util.Row justify="between">
        <H2 id={resourceType.id}>{resourceType.title}</H2>
        {admin && (
          <Dropdown 
            prompt="Edit Resource"
            items={resourceItems.map((item) => ({
              type: "item",
              text: item.label,
            }))}
          />
        )}
        {EditResourceTypeModalElement}
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
            src={
              resource.images[0].fileUrl || resource.images[0].file?.location
            }
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
