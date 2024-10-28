import React from "react";
import { useMaterials } from "../../hooks";
import { useParams } from "react-router-dom";
import { LoadableDropdownInput } from "../loadableDropdown/LoadableDropdown";
import { Util } from "tabler-react-2";

export const MaterialPicker = ({
  value,
  onChange,
  resourceTypeId,
  opLoading,
}) => {
  const { shopId } = useParams();
  const { materials, loading } = useMaterials(shopId, resourceTypeId);

  return (
    <Util.Col>
      <label className="form-label" style={{ marginBottom: "0.25rem" }}>
        Material
      </label>
      <LoadableDropdownInput
        loading={loading || opLoading}
        value={value}
        onChange={(v) => onChange(v.id)}
        values={materials.map((m) => ({
          id: m.id,
          label: m.title,
        }))}
        prompt="Select Material"
        showLabel={false}
      />
    </Util.Col>
  );
};
