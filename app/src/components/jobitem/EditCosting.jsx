import React, { useEffect, useState } from "react";
import { useModal } from "#modal";
import { Icon } from "#icon";
import { Util, Input, Badge } from "tabler-react-2";
import styles from "./jobItem.module.css";
import { Price } from "#renderPrice";
import { Time } from "../time/RenderTime";
import { Button } from "#button";
import {
  calculateConfiguredSubtotal,
  getEnabledCostingCriteria,
  isRawValueMode,
} from "../../util/costingCriteria";

export const EditCosting = ({
  item,
  onChange,
  loading,
  userIsPrivileged = false,
}) => {
  const [newItem, setNewItem] = useState(item);
  const { modal, ModalElement } = useModal({ title: "Help", text: "" });

  useEffect(() => {
    setNewItem(item);
  }, [item]);

  const enabledCriteria = getEnabledCostingCriteria(newItem?.resourceType);
  const isRawMode = isRawValueMode(newItem?.resourceType);
  const parsedQty = Number.parseFloat(newItem?.qty);
  const normalizedQty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1;

  const calculateTotalCost = (includeQty = true) => {
    return (
      calculateConfiguredSubtotal(newItem) * (includeQty ? normalizedQty : 1)
    );
  };

  const subtotalCost = calculateTotalCost(false);
  const totalCost = calculateTotalCost(true);

  const renderReadOnlyCriterion = (criterion) => {
    switch (criterion.key) {
      case "RAW_VALUE":
        return (
          <Util.Row key={criterion.key} gap={1} align="center" justify="between">
            <label className="form-label">{criterion.label}</label>
            <div
              style={{
                flex: 1,
                height: 2,
                backgroundColor: "var(--tblr-border-color)",
              }}
            />
            <Price value={newItem.rawValue || 0} icon />
          </Util.Row>
        );
      case "RESOURCE_TIME":
      case "PROCESSING_TIME":
        return (
          <Util.Row key={criterion.key} gap={1} align="center" justify="between">
            <label className="form-label">{criterion.label}</label>
            <div
              style={{
                flex: 1,
                height: 2,
                backgroundColor: "var(--tblr-border-color)",
              }}
            />
            <Time
              value={
                criterion.key === "RESOURCE_TIME"
                  ? newItem.timeQty
                  : newItem.processingTimeQty
              }
              icon
            />
          </Util.Row>
        );
      case "UNIT_RUNS":
      case "PRIMARY_MATERIAL":
      case "SECONDARY_MATERIAL":
        return (
          <Util.Row key={criterion.key} gap={1} align="center" justify="between">
            <label className="form-label">{criterion.label}</label>
            <div
              style={{
                flex: 1,
                height: 2,
                backgroundColor: "var(--tblr-border-color)",
              }}
            />
            <Icon i="weight" />
            <span>
              {criterion.key === "UNIT_RUNS"
                ? newItem.unitQty || 0
                : criterion.key === "PRIMARY_MATERIAL"
                  ? newItem.materialQty || 0
                  : newItem.secondaryMaterialQty || 0}
            </span>
          </Util.Row>
        );
      default:
        return null;
    }
  };

  const renderEditableCriterion = (criterion) => {
    switch (criterion.key) {
      case "RAW_VALUE":
        return (
          <React.Fragment key={criterion.key}>
            <Util.Col gap={0.5} align="start" className={styles.costSection}>
              <label className="form-label mb-0">{criterion.label}</label>
              <Input
                value={newItem.rawValue || 0}
                onChange={(value) => {
                  const parsedValue = parseFloat(value);
                  setNewItem({
                    ...newItem,
                    rawValue:
                      Number.isNaN(parsedValue) || parsedValue < 0
                        ? 0
                        : parsedValue,
                  });
                }}
                type="number"
                min={0}
              />
            </Util.Col>
            <Util.Spacer size={1} />
          </React.Fragment>
        );
      case "RESOURCE_TIME":
        return (
          <TimeInput
            key={criterion.key}
            label={criterion.label}
            helpText={HELP_TEXT.resourceTime}
            timeQty={newItem.timeQty}
            costPerTime={newItem.resource?.costPerTime || 0}
            onChange={(value) => setNewItem({ ...newItem, timeQty: value })}
            modal={modal}
            showInput={userIsPrivileged}
          />
        );
      case "PROCESSING_TIME":
        return (
          <TimeInput
            key={criterion.key}
            label={criterion.label}
            helpText={HELP_TEXT.processingTime}
            timeQty={newItem.processingTimeQty}
            costPerTime={newItem.resource?.costPerProcessingTime || 0}
            onChange={(value) =>
              setNewItem({ ...newItem, processingTimeQty: value })
            }
            modal={modal}
            showInput={userIsPrivileged}
          />
        );
      case "UNIT_RUNS":
        return (
          <QuantityInput
            key={criterion.key}
            label={criterion.label}
            helpText={HELP_TEXT.unit}
            quantity={newItem.unitQty}
            costPerUnit={newItem.resource?.costPerUnit || 0}
            icon={<Icon i="refresh" />}
            onChange={(value) => setNewItem({ ...newItem, unitQty: value })}
            modal={modal}
            showInput={userIsPrivileged}
          />
        );
      case "PRIMARY_MATERIAL":
        return (
          <QuantityInput
            key={criterion.key}
            label={criterion.label}
            helpText={HELP_TEXT.material}
            quantity={newItem.materialQty}
            costPerUnit={newItem.material?.costPerUnit || 0}
            icon={<Icon i="weight" />}
            onChange={(value) => setNewItem({ ...newItem, materialQty: value })}
            modal={modal}
            showInput={userIsPrivileged}
          />
        );
      case "SECONDARY_MATERIAL":
        return (
          <QuantityInput
            key={criterion.key}
            label={criterion.label}
            helpText={HELP_TEXT.secondaryMaterial}
            quantity={newItem.secondaryMaterialQty}
            costPerUnit={newItem.secondaryMaterial?.costPerUnit || 0}
            icon={<Icon i="weight" />}
            onChange={(value) =>
              setNewItem({ ...newItem, secondaryMaterialQty: value })
            }
            modal={modal}
            showInput={userIsPrivileged}
          />
        );
      default:
        return null;
    }
  };

  const getSavePayload = () => {
    if (isRawMode) {
      return {
        rawValue: newItem.rawValue,
      };
    }

    return enabledCriteria.reduce((payload, criterion) => {
      if (criterion.key === "RESOURCE_TIME") payload.timeQty = newItem.timeQty;
      if (criterion.key === "PROCESSING_TIME") {
        payload.processingTimeQty = newItem.processingTimeQty;
      }
      if (criterion.key === "UNIT_RUNS") payload.unitQty = newItem.unitQty;
      if (criterion.key === "PRIMARY_MATERIAL") {
        payload.materialQty = newItem.materialQty;
      }
      if (criterion.key === "SECONDARY_MATERIAL") {
        payload.secondaryMaterialQty = newItem.secondaryMaterialQty;
      }
      return payload;
    }, {});
  };

  if (!userIsPrivileged)
    return (
      <div style={{ width: "100%" }}>
        {isRawMode ? (
          renderReadOnlyCriterion(enabledCriteria[0])
        ) : (
          <>{enabledCriteria.map((criterion) => renderReadOnlyCriterion(criterion))}</>
        )}
        <Util.Row gap={1} align="center" justify="between">
          <div />
          <span className={styles.bottomLine}>
            <Util.Row gap={1} justify="end">
              Subtotal
              <Price value={subtotalCost} icon />{" "}
              {normalizedQty > 1 && (
                <>
                  <Icon i="x" />
                  {normalizedQty}
                </>
              )}
            </Util.Row>
            <Util.Row gap={1} justify="end">
              Total:
              <Price value={totalCost} icon />
            </Util.Row>
          </span>
        </Util.Row>
      </div>
    );

  return (
    <div style={{ width: "100%" }}>
      {ModalElement}
      {enabledCriteria.map((criterion) => renderEditableCriterion(criterion))}
      <Util.Row gap={1} align="center" justify="between">
        {JSON.stringify(newItem) !== JSON.stringify(item) ? (
          <Util.Row gap={1} align="center" wrap>
            <Button
              onClick={() => onChange(getSavePayload())}
              loading={loading}
            >
              Save
            </Button>
            <Button onClick={() => setNewItem(item)}>Discard</Button>
            <Badge color="red" soft>
              You have unsaved changes!
            </Badge>
          </Util.Row>
        ) : (
          <div></div>
        )}
        <span className={styles.bottomLine}>
          <Util.Row gap={1} justify="end">
            Subtotal
            <Price value={subtotalCost} icon />{" "}
            {normalizedQty > 1 && (
              <>
                <Icon i="x" />
                {normalizedQty}
              </>
            )}
          </Util.Row>
          <Util.Row gap={1} justify="end">
            Total:
            <Price value={totalCost} icon />
          </Util.Row>
        </span>
      </Util.Row>
    </div>
  );
};

export const TimeInput = ({
  label,
  helpText,
  timeQty,
  costPerTime,
  onChange,
  modal,
  showInput = true,
}) => (
  <>
    <Util.Col gap={0.5} align="start" className={styles.costSection}>
      <label className="form-label" style={{ marginBottom: 0 }}>
        {label} {helpText && <Help text={helpText} modal={modal} />}
      </label>
      <Util.Row
        gap={1}
        align="center"
        wrap
        className={styles.costingInputRow}
        style={{ width: "100%" }}
      >
        {showInput && (
          <div className={styles.costingInputGroup}>
            <Input
              size="sm"
              noMargin
              placeholder="Hr"
              style={{ width: 56 }}
              value={Math.floor(timeQty || 0)}
              onChange={(e) => {
                const decimalPart = timeQty % 1 || 0;
                let newTime = parseInt(e) + decimalPart;
                if (newTime < 0 || isNaN(newTime)) newTime = 0;
                onChange(newTime);
              }}
              type="number"
              min={0}
            />
            :
            <Input
              size="sm"
              noMargin
              placeholder="Min"
              style={{ width: 56 }}
              value={Math.round((timeQty % 1 || 0) * 60)}
              onChange={(e) => {
                const hours = Math.floor(timeQty || 0);
                const minutes = parseInt(e) / 60;
                let newTime = hours + minutes;
                if (newTime < 0 || isNaN(newTime)) newTime = 0;
                onChange(newTime);
              }}
              type="number"
              min={0}
            />
          </div>
        )}
        <div
          className={styles.costingDivider}
          style={{
            flex: 1,
            height: 2,
            backgroundColor: "var(--tblr-border-color)",
          }}
        />
        <div className={styles.costingValueGroup}>
          <Time value={timeQty} icon />
          <Icon i="x" />
          <Price value={costPerTime} icon />
          <Icon i="equal" />
          <Price value={timeQty * costPerTime} icon />
        </div>
      </Util.Row>
    </Util.Col>
    <Util.Spacer size={1} />
  </>
);

export const QuantityInput = ({
  label,
  helpText,
  quantity,
  costPerUnit,
  icon,
  onChange,
  modal,
  showInput = true,
}) => (
  <>
    <Util.Col gap={0.5} align="start" className={styles.costSection}>
      <label className="form-label" style={{ marginBottom: 0 }}>
        {label} {helpText && <Help text={helpText} modal={modal} />}
      </label>
      <Util.Row
        gap={1}
        align="center"
        wrap
        className={styles.costingInputRow}
        style={{ width: "100%" }}
      >
        {showInput && (
          <Input
            size="sm"
            noMargin
            value={quantity || 0}
            onChange={(e) => {
              let val = parseFloat(e);
              if (isNaN(val) || val < 0) val = 0;
              onChange(val);
            }}
            type="number"
            min={0}
            style={{ width: 112 }}
          />
        )}
        <div
          className={styles.costingDivider}
          style={{
            flex: 1,
            height: 2,
            backgroundColor: "var(--tblr-border-color)",
          }}
        />
        <div className={styles.costingValueGroup}>
          {icon}
          <span>{quantity || 0}</span>
          <Icon i="x" />
          <Price value={costPerUnit} icon />
          <Icon i="equal" />
          <Price value={quantity * costPerUnit} icon />
        </div>
      </Util.Row>
    </Util.Col>
    <Util.Spacer size={1} />
  </>
);

const Help = ({ text, modal }) => (
  <a onClick={() => modal({ text })} style={{ cursor: "pointer" }}>
    <Icon i="help-circle" color="blue" />
  </a>
);

export const HELP_TEXT = {
  resourceTime:
    "The time the resource will spend on this job item. This is a way to charge for machine time.",
  processingTime: "The time an operator will spend processing this job item.",
  unit: "The number of actions for the item. This could be the number of build plates for 3d prints, or setups for traditional prints or machinery.",
  material: "The amount of material used for this job item.",
  secondaryMaterial: "The amount of secondary material used for this job item.",
};
