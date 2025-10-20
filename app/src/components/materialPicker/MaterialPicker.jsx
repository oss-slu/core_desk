import React from "react";
import { useMaterials } from "#hooks";
import { useParams } from "react-router-dom";
import { LoadableDropdownInput } from "#loadableDropdown";
import { Util } from "tabler-react-2";
import * as Sentry from "@sentry/react";
import ErrorBoundaries from "../ErrorBoundaries/ErrorBoundaries";

export const MaterialPicker = ({
  value,
  onChange,
  resourceTypeId,
  opLoading,
  includeNone,
  materialType
}) => {
  const { shopId } = useParams();
  const { materials, loading } = useMaterials(shopId, resourceTypeId);

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack }) => (
        <ErrorBoundaries
          error={error}
          stackTrace={componentStack}
        />
      )}
    >
    <Util.Col>
      <LoadableDropdownInput
        loading={loading || opLoading}
        value={value}
        onChange={(v) => onChange(v.id)}
        values={[
          ...materials.map((m) => ({
            id: m.id,
            label: m.title,
          })),
          includeNone
            ? {
                id: null,
                label: "Select a material",
                dropdownText: "None",
              }
            : null,
        ].filter((v) => v)}
        prompt="Select Material"
        label={`${materialType} Material`}
      />
    </Util.Col>
    </Sentry.ErrorBoundary>
  );
};
