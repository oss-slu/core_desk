import React, { useEffect, useState } from "react";
import { Util, Typography, Switch, Input, Card } from "tabler-react-2";
import { HELP_TEXT, QuantityInput, TimeInput } from "./EditCosting";
import { Button } from "tabler-react-2/dist/button";
import { ResourceTypePicker } from "../resourceTypePicker/ResourceTypePicker";
import { ResourcePicker } from "../resourcePicker/ResourcePicker";
import { MaterialPicker } from "../materialPicker/MaterialPicker";
import {
  useAdditionalLineItem,
  useAdditionalLineItems,
  useMaterial,
  useResource,
} from "../../hooks";
import { useParams } from "react-router-dom";
import { Spinner } from "tabler-react-2/dist/spinner";
import { Icon } from "../../util/Icon";
import Badge from "tabler-react-2/dist/badge";
import { Price } from "../price/RenderPrice";
const { H2, H3 } = Typography;
import styles from "./jobItem.module.css";

export const ProjectWideEditCosting = ({ job: initialJob, loading }) => {
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

  return (
    <>
      <Util.Col gap={0.5}>
        <Util.Row align="center" justify="between">
          <H2>Project-wide costing</H2>
        </Util.Row>
        <Switch
          label="Override or add to project-wide cost"
          value={job.additionalCostOverride}
          onChange={(value) => {
            setJob({ ...job, additionalCostOverride: value });
          }}
          loading={loading}
        />
        <p>
          {job.additionalCostOverride
            ? "You are overriding the project-wide cost"
            : "You are adding to the project-wide cost"}
        </p>
        {lineItems?.length > 0 ? (
          <div>
            {lineItems.map((additionalCost) => (
              <>
                <CostCard
                  lineItemId={additionalCost.id}
                  key={additionalCost.id}
                  refetchLineItems={fetchLineItems}
                />
                <Util.Spacer size={1} />
              </>
            ))}
            <Button onClick={createLineItem} loading={createOpLoading}>
              Add another additional cost
            </Button>
          </div>
        ) : (
          <Card>
            <p>There are no additional costs for this job</p>
            <Button onClick={createLineItem} loading={createOpLoading}>
              Add additional cost
            </Button>
          </Card>
        )}
      </Util.Col>
    </>
  );
};

const CostCard = ({ lineItemId, refetchLineItems }) => {
  const { shopId, jobId } = useParams();
  const { lineItem, updateLineItem, deleteLineItem, opLoading } =
    useAdditionalLineItem(shopId, jobId, lineItemId);
  const [localLineItem, setLocalLineItem] = useState(lineItem);

  const { loading: materialLoading, material } = useMaterial(
    shopId,
    localLineItem?.resourceTypeId,
    localLineItem?.materialId
  );
  const { loading: resourceLoading, resource } = useResource(
    shopId,
    localLineItem?.resourceId
  );

  const changed = JSON.stringify(localLineItem) !== JSON.stringify(lineItem);

  useEffect(() => {
    setLocalLineItem(lineItem);
  }, [lineItem]);

  if (!localLineItem) return null;

  const calculateTotalCost = () => {
    const { timeQty, processingTimeQty, unitQty, materialQty } = localLineItem;
    return (
      (timeQty * resource?.costPerTime || 0) +
      (processingTimeQty * resource?.costPerProcessingTime || 0) +
      (unitQty * resource?.costPerUnit || 0) +
      (materialQty * material?.costPerUnit || 0)
    );
  };

  const handleSave = () => {
    updateLineItem(localLineItem);
    // console.log(localLineItem);
  };

  return (
    <Card key={localLineItem.id}>
      <Util.Col gap={1}>
        <Util.Row gap={1} align="start">
          <Util.Col gap={1}>
            <ResourceTypePicker
              value={localLineItem.resourceTypeId}
              onChange={(value) =>
                setLocalLineItem({
                  ...localLineItem,
                  resourceTypeId: value,
                  resourceId: null,
                  materialId: null,
                })
              }
              loading={opLoading}
            />
            {localLineItem.resourceTypeId ? (
              <Util.Row gap={1}>
                <ResourcePicker
                  value={localLineItem.resourceId}
                  resourceTypeId={localLineItem.resourceTypeId}
                  onChange={(value) =>
                    setLocalLineItem({ ...localLineItem, resourceId: value })
                  }
                  loading={opLoading}
                />
                <MaterialPicker
                  value={localLineItem.materialId}
                  resourceTypeId={localLineItem.resourceTypeId}
                  onChange={(value) =>
                    setLocalLineItem({ ...localLineItem, materialId: value })
                  }
                  loading={opLoading}
                />
              </Util.Row>
            ) : (
              <i style={{ alignSelf: "center" }}>
                Select a resource type to continue
              </i>
            )}
          </Util.Col>
          <div style={{ flex: 1 }} />
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
        </Util.Row>
        <Util.Col gap={1}>
          <H3>Line Item Quantities</H3>
          {localLineItem.resourceTypeId &&
          localLineItem.resourceId &&
          localLineItem.materialId ? (
            <>
              {materialLoading || resourceLoading ? (
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
                  <TimeInput
                    label="Resource Time (hr:mm)"
                    timeQty={localLineItem.timeQty || 0}
                    costPerTime={resource.costPerTime || 0}
                    onChange={(value) =>
                      setLocalLineItem({ ...localLineItem, timeQty: value })
                    }
                  />
                  <TimeInput
                    label="Processing Time (hr:mm)"
                    timeQty={localLineItem.processingTimeQty || 0}
                    costPerTime={resource.costPerProcessingTime || 0}
                    onChange={(value) =>
                      setLocalLineItem({
                        ...localLineItem,
                        processingTimeQty: value,
                      })
                    }
                  />
                  <QuantityInput
                    label="Unit runs"
                    quantity={localLineItem.unitQty || 0}
                    costPerUnit={resource.costPerUnit || 0}
                    icon={<Icon i="refresh" />}
                    onChange={(value) =>
                      setLocalLineItem({ ...localLineItem, unitQty: value })
                    }
                  />
                  <QuantityInput
                    label={`Material quantity in ${material.unitDescriptor}s`}
                    quantity={localLineItem.materialQty || 0}
                    costPerUnit={material.costPerUnit || 0}
                    icon={<Icon i="weight" />}
                    onChange={(value) =>
                      setLocalLineItem({ ...localLineItem, materialQty: value })
                    }
                  />
                  <Util.Row gap={1} align="center" justify="end">
                    <span className={styles.bottomLine}>
                      <Util.Row gap={1}>
                        Total Cost:
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
                Costing unavailable without material and resource
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
