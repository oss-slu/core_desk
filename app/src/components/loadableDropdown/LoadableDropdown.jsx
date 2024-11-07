import React from "react";
import { Button, DropdownInput, Util } from "tabler-react-2";
import { switchStatusToUI } from "../jobitem/JobItem";

export const LoadableDropdownInput = ({
  values,
  value,
  onChange,
  prompt,
  loading,
  label,
  showLabel = true,
  doTheColorThing = false,
  disabled = false,
  disabledText,
  color,
}) => {
  if (loading)
    return (
      <Util.Col>
        {showLabel && <label className="form-label">{label}</label>}
        <Button loading disabled>
          {prompt}
        </Button>
      </Util.Col>
    );

  if (disabled)
    return (
      <Util.Col>
        {showLabel && <label className="form-label">{label}</label>}
        <Button disabled>{disabledText || prompt}</Button>
      </Util.Col>
    );

  return (
    <Util.Col>
      {showLabel && <label className="form-label">{label}</label>}
      <DropdownInput
        values={values}
        value={value}
        onChange={onChange}
        prompt={prompt}
        color={color || (doTheColorThing ? switchStatusToUI(value)[1] : null)}
        data-value={value}
        data-color={
          color || (doTheColorThing ? switchStatusToUI(value)[1] : null)
        }
        outline={color || doTheColorThing}
      />
    </Util.Col>
  );
};
