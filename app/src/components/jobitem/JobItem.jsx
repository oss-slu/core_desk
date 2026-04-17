import React, { useEffect, useState } from "react";
import {
  Card,
  Util,
  Typography,
  DropdownInput,
  Input,
  Badge,
  Button,
  useModal,
  Spinner,
} from "tabler-react-2";
import { RenderMedia } from "../media/renderMedia";
import { Icon } from "#icon";
import { Link, useParams } from "react-router-dom";
const { H3, H4 } = Typography;
import styles from "./jobItem.module.css";
import { LoadableDropdownInput } from "#loadableDropdown";
import { ResourceTypePicker } from "../resourceTypePicker/ResourceTypePicker";
import { MaterialPicker } from "../materialPicker/MaterialPicker";
import { ResourcePicker } from "../resourcePicker/ResourcePicker";
import {
  calculateConfiguredSubtotal,
  hasRequiredCostingSelections,
  isRawValueMode,
  needsSecondaryMaterialSelection,
} from "../../util/costingCriteria";

import { EditCosting } from "./EditCosting";
import {
  useAuth,
  useBillingGroupUser,
  useJobItem,
  useMaterials,
  useResources,
  useResourceTypes,
} from "#hooks";
import * as Sentry from "@sentry/react";
import ErrorBoundaries from "../ErrorBoundaries/ErrorBoundaries";

export function downloadFile(url, filename) {
  if (!url) return;

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }
      return response.blob();
    })
    .then((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href); // Clean up
    })
    .catch(() => {
      // Fallback for cross-origin URLs (ex: S3) when fetch is blocked by CORS.
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = filename;
      link.click();
    })
    .catch((error) => {
      console.error("Error downloading file:", error);
    });
}

export const switchStatusToUI = (status) => {
  switch (status) {
    case "IN_PROGRESS":
      return ["In Progress", "yellow"];
    case "COMPLETED":
      return ["Completed", "green"];
    case "NOT_STARTED":
      return ["Not Started", "red"];
    case "CANCELLED":
      return ["Cancelled", "secondary"];
    case "WONT_DO":
      return ["Won't Do", "secondary"];
    case "WAITING":
      return ["Waiting", "blue"];
    case "WAITING_FOR_PICKUP":
      return ["Waiting for Pickup", "teal"];
    case "WAITING_FOR_PAYMENT":
      return ["Waiting for Payment", "orange"];
    default:
      return [status, "secondary"];
  }
};

export const JobItem = ({
  item: _item,
  refetchJobs,
  userIsPrivileged,
  group,
}) => {
  const { shopId, jobId } = useParams();
  const { user: activeUser } = useAuth();

  const { item, opLoading, updateJobItem, deleteJobItem } = useJobItem(
    shopId,
    jobId,
    _item.id,
    {
      initialValue: _item,
      fetchJobItem: false,
    }
  );

  const { modal, ModalElement } = useModal({
    title: item?.title,
    text: (
      <div>
        <RenderMedia big mediaUrl={item?.fileUrl} fileType={item?.fileType} />
      </div>
    ),
  });

  const { billingGroupUser, loading: billingGroupUserLoading } =
    useBillingGroupUser(shopId, group?.id, activeUser?.id);
  const { materials = [] } = useMaterials(shopId, item?.resourceTypeId);
  const { resources = [] } = useResources(shopId, item?.resourceTypeId);
  const { resourceTypes = [] } = useResourceTypes(shopId);
  const [localQty, setLocalQty] = useState(item?.qty);
  const [resourceEditorOpen, setResourceEditorOpen] = useState(false);
  const [costEditorOpen, setCostEditorOpen] = useState(false);

  if (!item) return null;

  useEffect(() => {
    setLocalQty(item?.qty);
  }, [item?.qty]);

  const resolvedResourceType =
    item.resourceType ||
    resourceTypes.find((resourceType) => resourceType.id === item.resourceTypeId) ||
    null;

  const isRawMode = isRawValueMode(resolvedResourceType);
  const costingAvailable = hasRequiredCostingSelections({
    ...item,
    resourceType: resolvedResourceType,
  });
  const showResourcePicker = !isRawMode;
  const showPrimaryMaterialPicker = !isRawMode;
  const showSecondaryMaterialPicker = needsSecondaryMaterialSelection(
    resolvedResourceType
  );
  const showSecondaryMaterialConfig = !isRawMode;

  const parsedLocalQty = Number.parseFloat(localQty);
  const parsedItemQty = Number.parseFloat(item.qty);
  const normalizedQty =
    Number.isFinite(parsedLocalQty) && parsedLocalQty > 0
      ? parsedLocalQty
      : Number.isFinite(parsedItemQty) && parsedItemQty > 0
        ? parsedItemQty
        : 1;

  const calculateTotalCost = (includeQty = true) => {
    return (
      calculateConfiguredSubtotal({
        ...item,
        resourceType: resolvedResourceType,
      }) * (includeQty ? normalizedQty : 1)
    );
  };

  const totalCost = calculateTotalCost(true);

  const resolvedResourceTypeTitle =
    resolvedResourceType?.title || "Resource type";

  const resolvedResourceTitle =
    item.resource?.title ||
    resources.find((resource) => resource.id === item.resourceId)?.title ||
    "No resource";

  const resolvedPrimaryMaterialTitle =
    item.material?.title ||
    materials.find((material) => material.id === item.materialId)?.title ||
    "No primary material";

  const resolvedSecondaryMaterialTitle =
    item.secondaryMaterial?.title ||
    materials.find((material) => material.id === item.secondaryMaterialId)?.title ||
    "No secondary material";

  const resourceSummary = item.resourceTypeId ? (
    isRawMode ? (
      <>
        <div>{resolvedResourceTypeTitle}</div>
        <div>Raw value entry</div>
      </>
    ) : (
      <>
        {showResourcePicker && (
          <div>
            <strong>{resolvedResourceTypeTitle}: </strong>
            {resolvedResourceTitle}
          </div>
        )}
        {showPrimaryMaterialPicker && (
          <div>
            <strong>Primary material: </strong>
            {resolvedPrimaryMaterialTitle}
          </div>
        )}
        {showSecondaryMaterialPicker && (
          <div>
            <strong>Secondary material: </strong>
            {resolvedSecondaryMaterialTitle}
          </div>
        )}
      </>
    )
  ) : (
    "No resource or material setup selected"
  );

  const totalCostSummary = costingAvailable ? (
    <>
      <strong>Total cost: </strong>${totalCost.toFixed(2)}
    </>
  ) : (
    "Total cost unavailable"
  );

  const resourceConfigurationContent = (
    <div className={styles.sectionCard}>
      <Util.Col gap={1} align="start" wrap>
        <ResourceTypePicker
          value={item.resourceTypeId}
          loading={opLoading}
          onChange={(value) => updateJobItem({ resourceTypeId: value })}
          includeNone={true}
        />
        {item.resourceTypeId ? (
          isRawMode ? (
            <></>
          ) : (
            <>
              {showPrimaryMaterialPicker && (
                <MaterialPicker
                  value={item.materialId}
                  onChange={(value) => updateJobItem({ materialId: value })}
                  resourceTypeId={item.resourceTypeId}
                  opLoading={opLoading}
                  includeNone={true}
                  materialType={"Primary"}
                />
              )}
              {showSecondaryMaterialConfig && (
                <MaterialPicker
                  value={item.secondaryMaterialId}
                  onChange={(value) =>
                    updateJobItem({ secondaryMaterialId: value })
                  }
                  resourceTypeId={item.resourceTypeId}
                  opLoading={opLoading}
                  includeNone={true}
                  materialType={"Secondary"}
                />
              )}
              {showResourcePicker &&
                (userIsPrivileged ? (
                  <ResourcePicker
                    value={item.resourceId}
                    onChange={(value) => updateJobItem({ resourceId: value })}
                    resourceTypeId={item.resourceTypeId}
                    opLoading={opLoading}
                    includeNone={true}
                  />
                ) : (
                  <Util.Col gap={1}>
                    <label className="form-label mb-0">Resource</label>
                    <Badge color="blue" soft>
                      {item.resource?.title || "None"}
                    </Badge>
                  </Util.Col>
                ))}
            </>
          )
        ) : (
          <i>Select a resource type to see more options</i>
        )}
      </Util.Col>
    </div>
  );

  const costingContent = costingAvailable ? (
    <EditCosting
      item={item}
      onChange={(value) => updateJobItem(value)}
      loading={opLoading}
      userIsPrivileged={userIsPrivileged}
    />
  ) : (
    <Badge color="red" soft>
      <Icon i="coin-off" />
      Costing unavailable without material and resource
    </Badge>
  );

  return (
    <Sentry.ErrorBoundary
      fallback={({ error }) => <ErrorBoundaries error={error} />}
    >
      <Card>
        <Util.Responsive gap={1} align="start" threshold={1100}>
          <div className={styles.modal}>{ModalElement}</div>
          <div className={styles.primaryColumn}>
            <Util.Responsive gap={1} align="start" threshold={800}>
              <RenderMedia
                mediaUrl={item.file?.location}
                fileType={item.file?.originalname?.split(".")?.pop()}
                thumbnailUrl={
                  item.fileThumbnail?.location || item.fileThumbnailUrl
                }
              />
              <Util.Row
                gap={2}
                align="start"
                threshold={1200}
                style={{ flex: 1 }}
              >
                <div className={styles.itemDetails}>
                  <Util.Row gap={1}>
                    <H3 className="mb-0" style={{ wordBreak: "break-all" }}>
                      {item.title}
                    </H3>
                  </Util.Row>
                  {item.activeUser?.id && (
                    <span className={styles.metaRow}>
                      <Icon i="user" />
                      <Link to={`/shops/${shopId}/users/${item.activeUser.id}`}>
                        {item.activeUser.firstName} {item.activeUser.lastName}
                      </Link>
                    </span>
                  )}
                  {item.stlBoundingBoxX ? (
                    <>
                      <Util.Row gap={1}>
                        <span className={styles.metaRow}>
                          <Icon i="cube-3d-sphere" />
                          {item.stlBoundingBoxX.toFixed(2)} x{" "}
                          {item.stlBoundingBoxY.toFixed(2)} x{" "}
                          {item.stlBoundingBoxZ.toFixed(2)} cm
                        </span>
                        <span className={styles.metaRow}>
                          {item.stlIsWatertight ? (
                            <>
                              <Icon i="droplet" color="green" />
                              Watertight
                            </>
                          ) : (
                            <>
                              <Icon i="droplet-off" color="red" />
                              Not Watertight
                            </>
                          )}
                        </span>
                      </Util.Row>
                      <Util.Spacer size={0.5} />
                    </>
                  ) : (
                      <Util.Spacer size={1} />
                  )}
                  <Util.Row gap={1} align="center" wrap className={styles.controlsRow}>
                    <div className={styles.iconActions}>
                      <Button
                        onClick={modal}
                        className={styles.iconButton}
                      >
                        <Icon i="cube" size={16} />
                      </Button>
                      <Button
                        onClick={() => {
                          downloadFile(
                            item.fileUrl || item.file?.location,
                            item.title
                          );
                        }}
                        className={styles.iconButton}
                        download
                      >
                        <Icon i="download" size={16} />
                      </Button>
                      {userIsPrivileged && (
                        <Button
                          onClick={(e) => {
                            deleteJobItem(refetchJobs, e);
                          }}
                          className={styles.iconButton}
                          variant="danger"
                          outline
                        >
                          <Icon i="trash" size={16} />
                        </Button>
                      )}
                    </div>
                    {userIsPrivileged ? (
                      opLoading ? (
                        <Spinner />
                      ) : (
                        <div className={styles.statusControl}>
                          <DropdownInput
                            values={[
                              { id: "IN_PROGRESS", label: "In Progress" },
                              { id: "COMPLETED", label: "Completed" },
                              { id: "NOT_STARTED", label: "Not Started" },
                              { id: "CANCELLED", label: "Cancelled" },
                              { id: "WONT_DO", label: "Won't Do" },
                              { id: "WAITING", label: "Waiting" },
                              {
                                id: "WAITING_FOR_PICKUP",
                                label: "Waiting for Pickup",
                              },
                              {
                                id: "WAITING_FOR_PAYMENT",
                                label: "Waiting for Payment",
                              },
                            ]}
                            value={item.status}
                            onChange={(value) => {
                              updateJobItem({ status: value.id });
                            }}
                            color={switchStatusToUI(item.status)[1]}
                            outline
                          />
                        </div>
                      )
                    ) : (
                      <Badge color={switchStatusToUI(item.status)[1]} soft>
                        {switchStatusToUI(item.status)[0]}
                      </Badge>
                    )}
                  </Util.Row>
                  <Util.Spacer size={1} />
                  <Util.Row gap={0.5} align="center" wrap className={styles.qtyRow}>
                    <Input
                      placeholder="0"
                      value={localQty}
                      noMargin
                      className={styles.qtyInput}
                      onChange={(e) => setLocalQty(e)}
                      prependedText="Qty"
                      type="number"
                    />
                    {parseFloat(item.qty) !== parseFloat(localQty) &&
                      !isNaN(localQty) && (
                        <Button
                          onClick={() =>
                            updateJobItem({ qty: parseFloat(localQty) })
                          }
                          loading={opLoading}
                        >
                          Save
                        </Button>
                      )}
                  </Util.Row>
                  <Util.Row gap={1} wrap className={styles.approvalRow}>
                    {!billingGroupUserLoading &&
                    billingGroupUser.role === "ADMIN" ? (
                      <div className={item.approved === null && styles.callout}>
                        <LoadableDropdownInput
                          label={"Approval"}
                          loading={opLoading}
                          value={item.approved}
                          onChange={(value) =>
                            updateJobItem({ approved: value.id })
                          }
                          values={[
                            {
                              id: true,
                              label: "Approved",
                            },
                            { id: false, label: "Not Approved" },
                            { id: null, label: "Pending" },
                          ]}
                          color={
                            item.approved
                              ? "green"
                              : item.approved === false
                              ? "orange"
                              : "red"
                          }
                        />
                      </div>
                    ) : billingGroupUser?.id ? (
                      <>
                        <label className="form-label">Approval status</label>
                        <Badge
                          color={
                            item.approved
                              ? "green"
                              : item.approved === false
                              ? "orange"
                              : "red"
                          }
                          soft
                        >
                          {item.approved === null
                            ? "Pending"
                            : item.approved
                            ? "Approved"
                            : "Not Approved"}
                        </Badge>
                      </>
                    ) : (
                      <></>
                    )}
                  </Util.Row>
                </div>
              </Util.Row>
            </Util.Responsive>
          </div>
          <div className={styles.secondaryColumn}>
            <div className={styles.compactSection}>
              <Util.Row
                gap={1}
                align="start"
                justify="between"
                className={styles.summaryRow}
              >
                <div className={styles.summaryText}>{resourceSummary}</div>
                <Button
                  size="sm"
                  outline
                  onClick={() => setResourceEditorOpen((value) => !value)}
                >
                  {resourceEditorOpen ? "Close" : "Edit"}
                </Button>
              </Util.Row>
              {resourceEditorOpen && (
                <div className={styles.popupPanel}>
                  {resourceConfigurationContent}
                </div>
              )}
            </div>
          </div>
          <div className={styles.tertiaryColumn}>
            <div className={styles.compactSection}>
              <Util.Row
                gap={1}
                align="start"
                justify="between"
                className={styles.summaryRow}
              >
                <div className={styles.summaryText}>{totalCostSummary}</div>
                <Button
                  size="sm"
                  outline
                  onClick={() => setCostEditorOpen((value) => !value)}
                >
                  {costEditorOpen ? "Close" : "Edit"}
                </Button>
              </Util.Row>
              {costEditorOpen && (
                <div className={styles.popupPanel}>
                  <H4>Costing</H4>
                  {costingContent}
                </div>
              )}
            </div>
          </div>
        </Util.Responsive>
      </Card>
    </Sentry.ErrorBoundary>
  );
};
