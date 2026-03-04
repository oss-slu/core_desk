import React, { useEffect, useState } from "react";
import { Util, Typography, Switch, Card, Badge, Input } from "tabler-react-2";
import { Button } from "#button";
import {
  useAdditionalLineItem,
  useAdditionalLineItems,
  useAuth,
  useShop,
} from "#hooks";
import { useParams } from "react-router-dom";
import { Icon } from "#icon";
import { Price } from "#renderPrice";
const { H2, H3 } = Typography;
import styles from "./jobItem.module.css";

const calculateLegacyTotalCost = (lineItem) => {
  if (
    !lineItem?.resource ||
    !lineItem?.material ||
    !lineItem?.secondaryMaterial
  ) {
    return 0;
  }

  return (
    (lineItem.timeQty || 0) * (lineItem.resource.costPerTime || 0) +
    (lineItem.processingTimeQty || 0) *
      (lineItem.resource.costPerProcessingTime || 0) +
    (lineItem.unitQty || 0) * (lineItem.resource.costPerUnit || 0) +
    (lineItem.materialQty || 0) * (lineItem.material.costPerUnit || 0) +
    (lineItem.secondaryMaterialQty || 0) *
      (lineItem.secondaryMaterial.costPerUnit || 0)
  );
};

const getLineItemAmount = (lineItem) => {
  if (typeof lineItem?.amount === "number") {
    return lineItem.amount;
  }

  return calculateLegacyTotalCost(lineItem);
};

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
}) => {
  const { shopId, jobId } = useParams();
  const { lineItem, updateLineItem, deleteLineItem, opLoading, ConfirmModal } =
    useAdditionalLineItem(shopId, jobId, lineItemId, jobFinalized);
  const [localLineItem, setLocalLineItem] = useState(lineItem);

  useEffect(() => {
    if (!lineItem) {
      return;
    }

    setLocalLineItem(lineItem);
  }, [lineItem]);

  if (!localLineItem) return null;

  const amount = getLineItemAmount(localLineItem);
  const usesLegacyBuilder =
    typeof localLineItem.amount !== "number" &&
    (localLineItem.resourceTypeId ||
      localLineItem.resourceId ||
      localLineItem.materialId ||
      localLineItem.secondaryMaterialId);

  const changed = JSON.stringify(localLineItem) !== JSON.stringify(lineItem);

  const handleSave = async () => {
    const normalizedAmount = Math.max(Number(localLineItem.amount) || 0, 0);

    await updateLineItem({
      amount: normalizedAmount,
      resourceTypeId: null,
      resourceId: null,
      materialId: null,
      secondaryMaterialId: null,
      timeQty: null,
      processingTimeQty: null,
      unitQty: null,
      materialQty: null,
      secondaryMaterialQty: null,
    });

    refetchJob(false);
  };

  return (
    <Card key={localLineItem.id}>
      {ConfirmModal}
      <Util.Col gap={1}>
        <Util.Row gap={1} align="start">
          <Util.Col gap={0.5}>
            <H3 style={{ marginBottom: 0 }}>Additional Cost</H3>
            <label className="form-label mb-0">Amount to add to total</label>
            {userIsPrivileged ? (
              <Input
                noMargin
                value={localLineItem.amount ?? amount}
                onChange={(value) => {
                  const parsed = Number.parseFloat(value);
                  setLocalLineItem({
                    ...localLineItem,
                    amount: Number.isNaN(parsed) ? 0 : Math.max(parsed, 0),
                  });
                }}
                type="number"
                min={0}
                step={0.01}
                style={{ minWidth: 180, maxWidth: 220 }}
                icon={<Icon i="currency-dollar" />}
              />
            ) : (
              <Price value={amount} icon />
            )}
            {usesLegacyBuilder && (
              <Badge color="yellow" soft>
                <Icon i="alert-triangle" />
                Legacy additional cost detected. Saving will convert it to a
                direct dollar amount.
              </Badge>
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

        <Util.Row gap={1} align="center" justify="end">
          <span className={styles.bottomLine}>
            <Util.Row gap={1}>
              Total:
              <Price value={amount} icon />
            </Util.Row>
          </span>
        </Util.Row>

        {changed ? (
          <Util.Row gap={1} align="center">
            <Button onClick={handleSave} loading={opLoading}>
              Save
            </Button>
            <Button onClick={() => setLocalLineItem(lineItem)}>Discard</Button>
            <Badge color="red" soft>
              You have unsaved changes!
            </Badge>
          </Util.Row>
        ) : (
          <div />
        )}
      </Util.Col>
    </Card>
  );
};
