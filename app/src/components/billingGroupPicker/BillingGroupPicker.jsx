import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useBillingGroups } from "#hooks";
import { LoadableDropdownInput } from "#loadableDropdown";
import * as Sentry from "@sentry/react"
import ErrorBoundaries from "../ErrorBoundaries/ErrorBoundaries";
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
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack }) => (
        <ErrorBoundaries
          error={error}
          stackTrace={componentStack}
        />
      )}
    >

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
    </Sentry.ErrorBoundary>
  );
};
