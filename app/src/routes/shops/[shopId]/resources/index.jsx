import React, { useEffect, useState } from "react";
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
import {
  Typography,
  Util,
  Card,
  useConfirm,
  Dropdown,
  Input,
  Badge,
  Button,
} from "tabler-react-2";
import { Loading } from "#loading";
import { Icon } from "#icon";
import { Table } from "#table";
import { Spinner } from "#spinner";
import { useModal } from "#modal";
import { NotFound } from "../../../../components/404/404";
import toast from "react-hot-toast";
import {
  getEnabledCostingCriteria,
  getEditableCostingCriteria,
  moveArrayItem,
} from "../../../../util/costingCriteria";
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
    updateCostingCriteria,
    opLoading: resourceTypesOpLoading,
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
            prompt="Add..."
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
          updateCostingCriteria={updateCostingCriteria}
          opLoading={resourceTypesOpLoading}
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

const ResourceType = ({
  resourceType,
  shopId,
  admin,
  onDelete,
  updateCostingCriteria,
  opLoading,
}) => {
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
  const {
    modal: openCostingCriteriaModal,
    ModalElement: CostingCriteriaModalElement,
    close: closeCostingCriteriaModal,
  } = useModal({
    title: `${resourceType.title} Costing Criteria`,
    text: (
      <CostingCriteriaEditor
        resourceType={resourceType}
        admin={admin}
        updateCostingCriteria={updateCostingCriteria}
        loading={opLoading}
        onSaved={() => closeCostingCriteriaModal()}
      />
    ),
  });

  const resourceItems = [
    { label: <p style={{marginTop: 2, marginBottom: 2}} onClick={editResourceType}><Icon i="tools" /> Edit Resource Type</p> },
    { label: <p style={{marginTop: 2, marginBottom: 2}} onClick={openCostingCriteriaModal}><Icon i="list-check" /> Edit Costing Criteria</p> },
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
            prompt="Resource options"
            items={resourceItems.map((item) => ({
              type: "item",
              text: item.label,
            }))}
          />
        )}
        {EditResourceTypeModalElement}
        {CostingCriteriaModalElement}
      </Util.Row>
      <CostingCriteriaSummary
        resourceType={resourceType}
        admin={admin}
        onEdit={openCostingCriteriaModal}
      />
      <Util.Spacer size={1} />
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

const CostingCriteriaSummary = ({ resourceType, admin, onEdit }) => {
  const enabledCriteria = getEnabledCostingCriteria(resourceType);

  return (
    <div>
      <Util.Row justify="between" align="start" gap={1} wrap>
        <div>
          <H3>Costing Criteria</H3>
          <p style={{ marginTop: 0, marginBottom: 8 }}>
            {enabledCriteria.length > 0
              ? "Enabled criteria are shown in billing order."
              : "No costing criteria are currently enabled."}
          </p>
        </div>
      </Util.Row>
      <Util.Row gap={0.5} wrap>
        {enabledCriteria.map((criterion, index) => (
          <Badge key={criterion.criterionType || criterion.key} soft color="blue">
            {index + 1}. {criterion.label}
          </Badge>
        ))}
        {enabledCriteria.length === 0 ? (
          <Badge soft color="secondary">None enabled</Badge>
        ) : null}
      </Util.Row>
    </div>
  );
};

const CostingCriteriaEditor = ({
  resourceType,
  admin,
  updateCostingCriteria,
  loading,
  onSaved,
}) => {
  const [criteria, setCriteria] = useState(getEditableCostingCriteria(resourceType));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCriteria(getEditableCostingCriteria(resourceType));
  }, [resourceType]);

  const enabledCriteria = criteria.filter((criterion) => criterion.enabled);
  const disabledCriteria = criteria.filter((criterion) => !criterion.enabled);
  const changed =
    JSON.stringify(criteria) !==
    JSON.stringify(getEditableCostingCriteria(resourceType));

  const setCriterion = (key, nextValues) => {
    setCriteria((currentCriteria) =>
      currentCriteria.map((criterion) =>
        (criterion.key || criterion.criterionType) === key
          ? { ...criterion, ...nextValues }
          : criterion
      )
    );
  };

  const toggleCriterion = (key, enabled) => {
    setCriteria((currentCriteria) => {
      const nextCriteria = currentCriteria.map((criterion) =>
        (criterion.key || criterion.criterionType) === key
          ? { ...criterion, enabled }
          : criterion
      );
      const nextEnabled = nextCriteria.filter((criterion) => criterion.enabled);
      const nextDisabled = nextCriteria.filter((criterion) => !criterion.enabled);
      return [...nextEnabled, ...nextDisabled];
    });
  };

  const moveEnabledCriterion = (index, direction) => {
    setCriteria((currentCriteria) => {
      const currentEnabled = currentCriteria.filter((criterion) => criterion.enabled);
      const currentDisabled = currentCriteria.filter(
        (criterion) => !criterion.enabled
      );
      const movedEnabled = moveArrayItem(
        currentEnabled,
        index,
        index + direction
      );
      return [...movedEnabled, ...currentDisabled];
    });
  };

  const saveCriteria = async () => {
    try {
      setSaving(true);
      await updateCostingCriteria(
        resourceType.id,
        criteria.map((criterion, displayOrder) => ({
          id: criterion.id,
          criterionType: criterion.key || criterion.criterionType,
          label: criterion.label,
          enabled: criterion.enabled,
          displayOrder,
        }))
      );
      toast.success("Costing criteria updated");
      onSaved?.();
    } catch (error) {
      toast.error(error?.toString?.() || "Failed to update costing criteria");
    } finally {
      setSaving(false);
    }
  };

  const renderCriterionRow = (criterion, index, enabledList = false) => (
    <Util.Row
      key={criterion.key || criterion.criterionType}
      gap={1}
      align="center"
      wrap
      style={{
        padding: "10px 12px",
        border: "1px solid var(--tblr-border-color)",
        borderRadius: 12,
      }}
    >
      <Input
        label={enabledList ? "Enabled criterion" : "Available criterion"}
        value={criterion.label}
        onChange={(value) =>
          setCriterion(criterion.key || criterion.criterionType, { label: value })
        }
        disabled={!admin}
      />
      <label className="form-label" style={{ marginBottom: 0 }}>
        {criterion.enabled ? "Enabled" : "Disabled"}
      </label>
      {admin ? (
        <input
          type="checkbox"
          checked={criterion.enabled}
          onChange={(event) =>
            toggleCriterion(
              criterion.key || criterion.criterionType,
              event.target.checked
            )
          }
        />
      ) : (
        <Badge soft color={criterion.enabled ? "green" : "secondary"}>
          {criterion.enabled ? "Enabled" : "Disabled"}
        </Badge>
      )}
      {admin && enabledList ? (
        <Util.Row gap={0.5}>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => moveEnabledCriterion(index, -1)}
          >
            <Icon i="arrow-up" />
          </button>
          <button
            type="button"
            disabled={index === enabledCriteria.length - 1}
            onClick={() => moveEnabledCriterion(index, 1)}
          >
            <Icon i="arrow-down" />
          </button>
        </Util.Row>
      ) : null}
    </Util.Row>
  );

  return (
    <div
      style={{
        maxHeight: "70vh",
        overflowY: "auto",
        paddingRight: 4,
      }}
    >
      <H3>Costing Criteria</H3>
      <p style={{ marginTop: 0 }}>
        Enabled criteria appear in billing order. Disabled criteria stay here so
        you can turn them on later without changing the resource type mode.
      </p>
      <Util.Col gap={1}>
        {enabledCriteria.map((criterion, index) =>
          renderCriterionRow(criterion, index, true)
        )}
        {disabledCriteria.length > 0 ? (
          <>
            <span className="form-label">Disabled criteria</span>
            {disabledCriteria.map((criterion, index) =>
              renderCriterionRow(criterion, index, false)
            )}
          </>
        ) : null}
      </Util.Col>
      {admin && (
        <>
          <Util.Spacer size={1} />
          <Util.Row gap={1} align="center">
            <Button
              onClick={saveCriteria}
              loading={saving || loading}
              disabled={!changed}
            >
              Save Costing Criteria
            </Button>
            {changed ? <Badge color="red" soft>Unsaved changes</Badge> : null}
          </Util.Row>
        </>
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
