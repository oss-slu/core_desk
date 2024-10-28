import React from "react";
import { useResources } from "../../hooks";
import { useParams } from "react-router-dom";
import { LoadableDropdownInput } from "../loadableDropdown/LoadableDropdown";
import { Util } from "tabler-react-2";

export const ResourcePicker = ({
  value,
  onChange,
  resourceTypeId,
  opLoading,
}) => {
  const { shopId } = useParams();
  const { resources, loading } = useResources(shopId, resourceTypeId);

  return (
    <Util.Col>
      <label className="form-label" style={{ marginBottom: "0.25rem" }}>
        Resource
      </label>
      <LoadableDropdownInput
        loading={loading || opLoading}
        value={value}
        onChange={(v) => onChange(v.id)}
        values={resources.map((m) => ({
          id: m.id,
          label: m.title,
        }))}
        prompt="Select Resource"
        showLabel={false}
      />
    </Util.Col>
  );
};
