import React, { useEffect, useState } from "react";
import { useModal } from "tabler-react-2/dist/modal";
import { Icon } from "../../util/Icon";
import { Util, Input } from "tabler-react-2";
import styles from "./jobItem.module.css";
import { Price } from "../price/RenderPrice";
import { Time } from "../time/RenderTime";
import { Button } from "tabler-react-2/dist/button";
import Badge from "tabler-react-2/dist/badge";

export const EditCosting = ({ item, onChange, loading }) => {
  const [newItem, setNewItem] = useState(item);
  const { modal, ModalElement } = useModal({ title: "Help", text: "" });

  useEffect(() => {
    setNewItem(item);
  }, [item]);

  const calculateTotalCost = () => {
    const {
      timeQty,
      processingTimeQty,
      unitQty,
      materialQty,
      resource,
      material,
    } = newItem;
    return (
      (timeQty * resource.costPerTime || 0) +
      (processingTimeQty * resource.costPerProcessingTime || 0) +
      (unitQty * resource.costPerUnit || 0) +
      (materialQty * material.costPerUnit || 0)
    );
  };

  return (
    <div style={{ width: "100%" }}>
      {ModalElement}
      <TimeInput
        label="Resource Time (hr:mm)"
        helpText={HELP_TEXT.resourceTime}
        timeQty={newItem.timeQty}
        costPerTime={newItem.resource.costPerTime}
        onChange={(value) => setNewItem({ ...newItem, timeQty: value })}
        modal={modal}
      />
      <TimeInput
        label="Processing Time (hr:mm)"
        helpText={HELP_TEXT.processingTime}
        timeQty={newItem.processingTimeQty}
        costPerTime={newItem.resource.costPerProcessingTime}
        onChange={(value) =>
          setNewItem({ ...newItem, processingTimeQty: value })
        }
        modal={modal}
      />
      <QuantityInput
        label="Unit runs"
        helpText={HELP_TEXT.unit}
        quantity={newItem.unitQty}
        costPerUnit={newItem.resource.costPerUnit}
        icon={<Icon i="refresh" />}
        onChange={(value) => setNewItem({ ...newItem, unitQty: value })}
        modal={modal}
      />
      <QuantityInput
        label={`Material quantity in ${newItem.material.unitDescriptor}s`}
        helpText={HELP_TEXT.material}
        quantity={newItem.materialQty}
        costPerUnit={newItem.material.costPerUnit}
        icon={<Icon i="weight" />}
        onChange={(value) => setNewItem({ ...newItem, materialQty: value })}
        modal={modal}
      />
      <Util.Row gap={1} align="center" justify="between">
        {JSON.stringify(newItem) !== JSON.stringify(item) ? (
          <Util.Row gap={1} align="center">
            <Button onClick={() => onChange(newItem)} loading={loading}>
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
          <Util.Row gap={1}>
            Total Cost:
            <Price value={calculateTotalCost()} icon />
          </Util.Row>
        </span>
      </Util.Row>
    </div>
  );
};

const TimeInput = ({
  label,
  helpText,
  timeQty,
  costPerTime,
  onChange,
  modal,
}) => (
  <>
    <Util.Row gap={1} align="center">
      <label className="form-label" style={{ marginBottom: 0 }}>
        {label} <Help text={helpText} modal={modal} />
      </label>
      <Input
        size="sm"
        noMargin
        placeholder="Hr"
        style={{ minWidth: 40, maxWidth: 41 }}
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
        style={{ minWidth: 40, maxWidth: 41 }}
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
      <div style={{ flex: 1 }} />
      <Time value={timeQty} icon />
      <Icon i="x" />
      <Price value={costPerTime} icon />
      <Icon i="equal" />
      <Price value={timeQty * costPerTime} icon />
    </Util.Row>
    <Util.Spacer size={1} />
  </>
);

const QuantityInput = ({
  label,
  helpText,
  quantity,
  costPerUnit,
  icon,
  onChange,
  modal,
}) => (
  <>
    <Util.Row gap={1} align="center">
      <label className="form-label" style={{ marginBottom: 0 }}>
        {label} <Help text={helpText} modal={modal} />
      </label>
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
        style={{ minWidth: 100, maxWidth: 101 }}
      />
      <div style={{ flex: 1 }} />
      {icon}
      <span>{quantity || 0}</span>
      <Icon i="x" />
      <Price value={costPerUnit} icon />
      <Icon i="equal" />
      <Price value={quantity * costPerUnit} icon />
    </Util.Row>
    <Util.Spacer size={1} />
  </>
);

const Help = ({ text, modal }) => (
  <a onClick={() => modal({ text })} style={{ cursor: "pointer" }}>
    <Icon i="help-circle" color="blue" />
  </a>
);

const HELP_TEXT = {
  resourceTime:
    "The time the resource will spend on this job item. This is a way to charge for machine time.",
  processingTime: "The time an operator will spend processing this job item.",
  unit: "The number of actions for the item. This could be the number of build plates for 3d prints, or setups for traditional prints or machinery.",
  material: "The amount of material used for this job item.",
};
