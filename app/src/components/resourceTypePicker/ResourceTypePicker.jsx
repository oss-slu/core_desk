import React from "react";
import PropTypes from "prop-types";
import { useResourceTypes } from "../../hooks";
import { useParams } from "react-router-dom";
import { LoadableDropdownInput } from "../loadableDropdown/LoadableDropdown";

export const ResourceTypePicker = ({
  value,
  onChange,
  loading: providedLoading,
  includeNone = false,
}) => {
  const { shopId } = useParams();
  const { loading, resourceTypes } = useResourceTypes(shopId);

  return (
    <LoadableDropdownInput
      loading={loading || providedLoading}
      prompt={"Select a resource type"}
      label="Resource Type"
      value={value}
      onChange={(v) => onChange(v.id)}
      values={[
        ...resourceTypes.map((resourceType) => ({
          id: resourceType.id,
          label: resourceType.title,
        })),
        includeNone
          ? { id: null, label: "Select a type", dropdownText: "None" }
          : null,
      ].filter((v) => v)}
    />
  );
};

ResourceTypePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  loading: PropTypes.bool,
  includeNone: PropTypes.bool,
};
