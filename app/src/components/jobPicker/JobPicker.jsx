import React from "react";
import { useBillingGroup } from "#hooks";
import { useParams } from "react-router-dom";
import { LoadableDropdownInput } from "#loadableDropdown";
import { Util } from "tabler-react-2";

export const JobPicker = ({
  value,
  onChange,
  opLoading,
  includeNone = false,
  groupId,
  showLabel = true,
}) => {
  const { shopId } = useParams();
  const { loading, billingGroup } = useBillingGroup(shopId, groupId);

  const jobValues =
    billingGroup?.jobs?.map((m) => ({
      id: m.id,
      label: m.title,
    })) || [];

  return (
    <Util.Col>
      <LoadableDropdownInput
        loading={loading || opLoading}
        value={value}
        onChange={(v) => onChange(v.id)}
        values={[
          ...jobValues,
          includeNone
            ? {
                id: null,
                label: "Select a job",
                dropdownText: "None",
              }
            : null,
        ].filter((v) => v)}
        prompt="Select Job"
        label={"Job"}
        showLabel={showLabel}
      />
    </Util.Col>
  );
};
