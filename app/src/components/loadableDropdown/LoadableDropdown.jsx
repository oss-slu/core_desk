import React from "react";
import { Button, DropdownInput } from "tabler-react-2";
import { switchStatusToUI } from "../jobitem/JobItem";

export const LoadableDropdownInput = ({
  values,
  value,
  onChange,
  prompt,
  loading,
  label,
  doTheColorThing = false,
  disabled = false,
  disabledText,
}) => {
  if (loading)
    return (
      <>
        <label className="form-label">{label}</label>
        <Button loading disabled>
          {prompt}
        </Button>
      </>
    );

  if (disabled)
    return (
      <>
        <label className="form-label">{label}</label>
        <Button disabled>{disabledText || prompt}</Button>
      </>
    );

  return (
    <>
      <label className="form-label">{label}</label>
      <DropdownInput
        values={values}
        value={value}
        onChange={onChange}
        prompt={prompt}
        color={doTheColorThing ? switchStatusToUI(value)[1] : null}
        data-value={value}
        data-color={doTheColorThing ? switchStatusToUI(value)[1] : null}
        outline={doTheColorThing}
      />
    </>
  );
};
