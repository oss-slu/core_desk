import React, { useEffect, useState } from "react";
import { Util, Typography, Switch, Card, Badge, Input } from "tabler-react-2";
import { QuantityInput, TimeInput } from "./EditCosting";
import { Button } from "#button";
import { ResourceTypePicker } from "../resourceTypePicker/ResourceTypePicker";
import { ResourcePicker } from "../resourcePicker/ResourcePicker";
import { MaterialPicker } from "../materialPicker/MaterialPicker";
import {
  useAdditionalLineItem,
  useAdditionalLineItems,
  useAuth,
  useMaterial,
  useResource,
  useResourceTypes,
  useShop,
} from "#hooks";
import { useParams } from "react-router-dom";
import { Spinner } from "#spinner";
import { Icon } from "#icon";
import { Price } from "#renderPrice";
const { H2, H3 } = Typography;
import styles from "./jobItem.module.css";
import {
  calculateConfiguredSubtotal,
  getEnabledCostingCriteria,
  hasRequiredCostingSelections,
  isRawValueMode,
  needsPrimaryMaterialSelection,
  needsResourceSelection,
  needsSecondaryMaterialSelection,
} from "../../util/costingCriteria";

export const ProjectWideEditCosting = ({
  job: initialJob,
  loading,
  updateJob,
  refetchJob,
}) => {
  const [job, setJob] = useState(initialJob);
  const {
    createLineItem,
    lineItems,
    refetch: fetchLineItems,
    opLoading: createOpLoading,
  } = useAdditionalLineItems(initialJob.shopId, initialJob.id);
  const { resourceTypes } = useResourceTypes(initialJob.shopId);

  useEffect(() => {
    setJob(initialJob);
  }, [initialJob]);

  const { user } = useAuth();
  const { userShop } = useShop(initialJob.shopId);

  const userIsPrivileged =
    user?.admin ||
    userShop?.accountType === "ADMIN" ||
    userShop?.accountType === "OPERATOR";

  return (
    <>
      <Util.Col gap={0.5}>
        <Util.Row align="center" justify="between">
          <H2>Project-wide costing</H2>
        </Util.Row>

        {userIsPrivileged && (
          <Switch
            label="Override or add to project-wide cost"
            value={job.additionalCostOverride}
            onChange={(value) => {
              updateJob({
                additionalCostOverride: value,
              });
            }}
            loading={loading}
          />
        )}
        {userIsPrivileged ? (
          <p>
            {job.additionalCostOverride
              ? "You are overriding the item-based cost"
              : "You are adding to the item-based cost"}
          </p>
        ) : (
          <p>
            {job.additionalCostOverride
              ? "Additional costs override the item-based cost"
              : "Additional costs are in addition to the item-based cost"}
          </p>
        )}

        {lineItems?.length > 0 ? (
          <div>
            {lineItems.map((additionalCost) => (
              <React.Fragment key={additionalCost.id}>
                <CostCard
                  refetchJob={refetchJob}
                  lineItemId={additionalCost.id}
                  refetchLineItems={fetchLineItems}
                  jobFinalized={job.finalized}
                  userIsPrivileged={userIsPrivileged}
                  resourceTypes={resourceTypes}
                />
                <Util.Spacer size={1} />
              </React.Fragment>
            ))}
            {userIsPrivileged && (
              <Button onClick={createLineItem} loading={createOpLoading}>
                Add another additional cost
              </Button>
            )}
          </div>
        ) : (
          <Card>
            <p>There are no additional costs for this job.</p>
            {userIsPrivileged && (
              <Button onClick={createLineItem} loading={createOpLoading}>
                Add additional cost
              </Button>
            )}
          </Card>
        )}
      </Util.Col>
    </>
  );
};

const CostCard = ({
  lineItemId,
  refetchLineItems,
  jobFinalized,
  userIsPrivileged,
  refetchJob,
  resourceTypes,
}) => {
  const { shopId, jobId } = useParams();
  const { lineItem, updateLineItem, deleteLineItem, opLoading, ConfirmModal } =
    useAdditionalLineItem(shopId, jobId, lineItemId, jobFinalized);
  const [localLineItem, setLocalLineItem] = useState(lineItem);

  const selectedResourceType =
    resourceTypes?.find((_) => _.id === localLineItem?.resourceTypeId) ||
    localLineItem?.resourceType;

  const isRawMode = isRawValueMode(selectedResourceType);
  const enabledCriteria = getEnabledCostingCriteria(selectedResourceType);
  const showResourcePicker = needsResourceSelection(selectedResourceType);
  const showPrimaryMaterialPicker =
    needsPrimaryMaterialSelection(selectedResourceType);
  const showSecondaryMaterialPicker =
    needsSecondaryMaterialSelection(selectedResourceType);

  const { loading: materialLoading, material } = useMaterial(
    shopId,
    localLineItem?.resourceTypeId,
    localLineItem?.materialId,
  );

  const { loading: secondaryMaterialLoading, material: secondaryMaterial } =
    useMaterial(
      shopId,
      localLineItem?.resourceTypeId,
      localLineItem?.secondaryMaterialId,
    );

  const { loading: resourceLoading, resource } = useResource(
    shopId,
    localLineItem?.resourceId,
  );

  const changed = JSON.stringify(localLineItem) !== JSON.stringify(lineItem);

  useEffect(() => {
    if (!lineItem) return;

    setLocalLineItem({
      ...lineItem,
      secondaryMaterialQty: lineItem.secondaryMaterialQty ?? 0,
      rawValue: lineItem.rawValue ?? 0,
    });
  }, [lineItem]);

  if (!localLineItem) return null;

  const calculateTotalCost = () => {
    return calculateConfiguredSubtotal({
      ...localLineItem,
      resourceType: selectedResourceType,
      resource,
      material,
      secondaryMaterial,
    });
  };

  const handleSave = async () => {
    const payload = {
      resourceTypeId: localLineItem.resourceTypeId,
      resourceId: localLineItem.resourceId,
      materialId: localLineItem.materialId,
      secondaryMaterialId: localLineItem.secondaryMaterialId,
      amount: localLineItem.amount,
    };

    enabledCriteria.forEach((criterion) => {
      if (criterion.key === "RAW_VALUE") payload.rawValue = localLineItem.rawValue;
      if (criterion.key === "RESOURCE_TIME") {
        payload.timeQty = localLineItem.timeQty;
      }
      if (criterion.key === "PROCESSING_TIME") {
        payload.processingTimeQty = localLineItem.processingTimeQty;
      }
      if (criterion.key === "UNIT_RUNS") payload.unitQty = localLineItem.unitQty;
      if (criterion.key === "PRIMARY_MATERIAL") {
        payload.materialQty = localLineItem.materialQty;
      }
      if (criterion.key === "SECONDARY_MATERIAL") {
        payload.secondaryMaterialQty = localLineItem.secondaryMaterialQty;
      }
    });

    const success = await updateLineItem(payload);
    if (success) {
      refetchJob(false);
    }
  };

  return (
    <Card key={localLineItem.id}>
      {ConfirmModal}
      <Util.Col gap={1}>
        <Util.Row gap={1} align="start">
          <Util.Col gap={1}>
            {userIsPrivileged ? (
              <ResourceTypePicker
                value={localLineItem.resourceTypeId}
                onChange={(value) => {
                  const nextResourceType =
                    resourceTypes?.find((_) => _.id === value) || null;
                  setLocalLineItem({
                    ...localLineItem,
                    resourceTypeId: value,
                    resourceType: nextResourceType
                      ? {
                          id: nextResourceType.id,
                          title: nextResourceType.title,
                          costingMode: nextResourceType.costingMode,
                          costingCriteria: nextResourceType.costingCriteria,
                        }
                      : null,
                    resourceId: null,
                    materialId: null,
                    secondaryMaterialId: null,
                  });
                }}
                loading={opLoading}
              />
            ) : (
              <>
                <span className="form-label mb-0">Resource Type</span>
                <span>
                  <Badge soft>{selectedResourceType?.title}</Badge>
                </span>
              </>
            )}

            {localLineItem.resourceTypeId ? (
              isRawMode ? (
                <></>
              ) : (
                <Util.Row gap={1}>
                  {showResourcePicker &&
                    (userIsPrivileged ? (
                    <ResourcePicker
                      value={localLineItem.resourceId}
                      resourceTypeId={localLineItem.resourceTypeId}
                      onChange={(value) =>
                        setLocalLineItem({
                          ...localLineItem,
                          resourceId: value,
                        })
                      }
                      loading={opLoading}
                    />
                  ) : (
                    <Util.Col gap={1}>
                      <span className="form-label mb-0">Resource</span>
                      <span>
                        <Badge soft>{localLineItem.resource?.title}</Badge>
                      </span>
                    </Util.Col>
                  ))}
                  {showPrimaryMaterialPicker &&
                    (userIsPrivileged ? (
                    <MaterialPicker
                      value={localLineItem.materialId}
                      resourceTypeId={localLineItem.resourceTypeId}
                      onChange={(value) =>
                        setLocalLineItem({
                          ...localLineItem,
                          materialId: value,
                        })
                      }
                      loading={opLoading}
                      materialType={"Primary"}
                    />
                  ) : (
                    <Util.Col gap={1}>
                      <span className="form-label mb-0">Material</span>
                      <span>
                        <Badge soft>{localLineItem.material?.title}</Badge>
                      </span>
                    </Util.Col>
                  ))}
                  {showSecondaryMaterialPicker &&
                    (userIsPrivileged ? (
                    <MaterialPicker
                      value={localLineItem.secondaryMaterialId}
                      resourceTypeId={localLineItem.resourceTypeId}
                      onChange={(value) =>
                        setLocalLineItem({
                          ...localLineItem,
                          secondaryMaterialId: value,
                        })
                      }
                      loading={opLoading}
                      materialType={"Secondary"}
                    />
                  ) : (
                    <Util.Col gap={1}>
                      <span className="form-label mb-0">
                        Secondary Material
                      </span>
                      <span>
                        <Badge soft>
                          {localLineItem.secondaryMaterial?.title}
                        </Badge>
                      </span>
                    </Util.Col>
                  ))}
                </Util.Row>
              )
            ) : (
              <i style={{ alignSelf: "center" }}>
                Select a resource type to continue
              </i>
            )}
          </Util.Col>
          <div style={{ flex: 1 }} />
          {userIsPrivileged && (
            <Button
              color="danger"
              outline
              size="sm"
              onClick={() => deleteLineItem(refetchLineItems)}
              loading={opLoading}
            >
              <Icon i="trash" />
              Delete line item
            </Button>
          )}
        </Util.Row>
        <Util.Col gap={1}>
          <H3>Line Item Quantities</H3>
          {isRawMode && localLineItem.resourceTypeId ? (
            <Util.Col gap={0}>
              <Util.Col gap={0.5} align="start">
                <label className="form-label mb-0">Raw value</label>
                {userIsPrivileged ? (
                  <Input
                    value={localLineItem.rawValue || 0}
                    onChange={(value) => {
                      const parsedValue = parseFloat(value);
                      setLocalLineItem({
                        ...localLineItem,
                        rawValue:
                          Number.isNaN(parsedValue) || parsedValue < 0
                            ? 0
                            : parsedValue,
                      });
                    }}
                    type="number"
                    min={0}
                  />
                ) : (
                  <Price value={localLineItem.rawValue || 0} icon />
                )}
              </Util.Col>
              <Util.Spacer size={1} />
              <Util.Row gap={1} align="center" justify="end">
                <span className={styles.bottomLine}>
                  <Util.Row gap={1}>
                    Total:
                    <Price value={calculateTotalCost()} icon />
                  </Util.Row>
                </span>
              </Util.Row>
            </Util.Col>
          ) : localLineItem.resourceTypeId &&
            hasRequiredCostingSelections({
              ...localLineItem,
              resourceType: selectedResourceType,
            }) ? (
            <>
              {materialLoading ||
              secondaryMaterialLoading ||
              resourceLoading ? (
                <Spinner />
              ) : !resource || !material ? (
                <span>
                  <Badge color="danger" soft>
                    <Icon i="coin-off" />
                    Costing unavailable without material and resource
                  </Badge>
                </span>
              ) : (
                <Util.Col gap={0}>
                  {enabledCriteria.map((criterion) => {
                    if (criterion.key === "RESOURCE_TIME") {
                      return (
                        <TimeInput
                          key={criterion.key}
                          label={criterion.label}
                          timeQty={localLineItem.timeQty || 0}
                          costPerTime={resource?.costPerTime || 0}
                          onChange={(value) =>
                            setLocalLineItem({ ...localLineItem, timeQty: value })
                          }
                          showInput={userIsPrivileged}
                        />
                      );
                    }
                    if (criterion.key === "PROCESSING_TIME") {
                      return (
                        <TimeInput
                          key={criterion.key}
                          label={criterion.label}
                          timeQty={localLineItem.processingTimeQty || 0}
                          costPerTime={resource?.costPerProcessingTime || 0}
                          onChange={(value) =>
                            setLocalLineItem({
                              ...localLineItem,
                              processingTimeQty: value,
                            })
                          }
                          showInput={userIsPrivileged}
                        />
                      );
                    }
                    if (criterion.key === "UNIT_RUNS") {
                      return (
                        <QuantityInput
                          key={criterion.key}
                          label={criterion.label}
                          quantity={localLineItem.unitQty || 0}
                          costPerUnit={resource?.costPerUnit || 0}
                          icon={<Icon i="refresh" />}
                          onChange={(value) =>
                            setLocalLineItem({ ...localLineItem, unitQty: value })
                          }
                          showInput={userIsPrivileged}
                        />
                      );
                    }
                    if (criterion.key === "PRIMARY_MATERIAL") {
                      return (
                        <QuantityInput
                          key={criterion.key}
                          label={criterion.label}
                          quantity={localLineItem.materialQty || 0}
                          costPerUnit={material?.costPerUnit || 0}
                          icon={<Icon i="weight" />}
                          onChange={(value) =>
                            setLocalLineItem({
                              ...localLineItem,
                              materialQty: value,
                            })
                          }
                          showInput={userIsPrivileged}
                        />
                      );
                    }
                    if (criterion.key === "SECONDARY_MATERIAL") {
                      return (
                        <QuantityInput
                          key={criterion.key}
                          label={criterion.label}
                          quantity={localLineItem.secondaryMaterialQty || 0}
                          costPerUnit={secondaryMaterial?.costPerUnit || 0}
                          icon={<Icon i="weight" />}
                          onChange={(value) =>
                            setLocalLineItem({
                              ...localLineItem,
                              secondaryMaterialQty: value,
                            })
                          }
                          showInput={userIsPrivileged}
                        />
                      );
                    }
                    return null;
                  })}
                  <Util.Row gap={1} align="center" justify="end">
                    <span className={styles.bottomLine}>
                      <Util.Row gap={1}>
                        Total:
                        <Price value={calculateTotalCost()} icon />
                      </Util.Row>
                    </span>
                  </Util.Row>
                </Util.Col>
              )}
            </>
          ) : (
            <span>
              <Badge color="danger" soft>
                <Icon i="coin-off" />
                Costing unavailable without the required selections
              </Badge>
            </span>
          )}

          {changed ? (
            <Util.Row gap={1} align="center">
              <Button onClick={handleSave} loading={opLoading}>
                Save
              </Button>
              <Button onClick={() => setLocalLineItem(lineItem)}>
                Discard
              </Button>
              <Badge color="red" soft>
                You have unsaved changes!
              </Badge>
            </Util.Row>
          ) : (
            <div></div>
          )}
        </Util.Col>
      </Util.Col>
    </Card>
  );
};
