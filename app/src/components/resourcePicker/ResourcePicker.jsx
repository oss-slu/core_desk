import React from "react";
import { useResources } from "#hooks";
import { useParams } from "react-router-dom";
import { LoadableDropdownInput } from "#loadableDropdown";
import { Util } from "tabler-react-2";

export const ResourcePicker = ({
  value,
  onChange,
  resourceTypeId,
  opLoading,
  includeNone,
}) => {
  const { shopId } = useParams();
  const { resources, loading } = useResources(shopId, resourceTypeId);

  return (
    <Util.Col>
      <LoadableDropdownInput
        loading={loading || opLoading}
        value={value}
        onChange={(v) => onChange(v.id)}
        values={[
          ...resources.map((m) => ({
            id: m.id,
            label: m.title,
          })),
          includeNone
            ? {
                id: null,
                label: "Select a resource",
                dropdownText: "None",
              }
            : null,
        ].filter((v) => v)}
        prompt="Select Resource"
        label="Resource"
      />
    </Util.Col>
  );
};
