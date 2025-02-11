import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useBillingGroups } from "../../hooks";
import { LoadableDropdownInput } from "../loadableDropdown/LoadableDropdown";

const truncate = (str, n = 20) => {
  if (str.length <= n) return str;
  return str.slice(0, n - 1) + "...";
};

export const BillingGroupPicker = ({ value, onChange, includeNone }) => {
  const { shopId } = useParams();
  const { billingGroups, loading } = useBillingGroups(shopId);
  const [filteredBillingGroups, setFilteredBillingGroups] = useState([]);

  useEffect(() => {
    if (billingGroups && !loading) {
      setFilteredBillingGroups(
        billingGroups?.filter(
          (group) => group.userHasPermissionToCreateJobsOnBillingGroup
        )
      );
    }
  }, [loading, billingGroups]);

  return (
    <LoadableDropdownInput
      loading={loading}
      prompt={"Select a group"}
      showLabel={false}
      value={value}
      onChange={(v) => onChange(v.id)}
      values={[
        includeNone
          ? { id: null, label: "Select a group", dropdownText: "None" }
          : null,
        ...filteredBillingGroups.map((group) => ({
          id: group.id,
          label: group.title,
        })),
      ].filter((v) => v)}
    />
  );
};
