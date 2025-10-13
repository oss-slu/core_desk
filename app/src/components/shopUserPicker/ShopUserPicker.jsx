import React from "react";
import { useParams } from "react-router-dom";
import { useAuth, useUsers } from "#hooks";
import { LoadableDropdownInput } from "#loadableDropdown";
import * as Sentry from "@sentry/react";
import ErrorBoundaries from "../ErrorBoundaries/ErrorBoundaries";

export const ShopUserPicker = ({ value, onChange, includeNone }) => {
  const { shopId } = useParams();
  const { users, loading } = useUsers(shopId);
  const { user: activeUser, loading: authLoading } = useAuth();

  return (
    <>
    <Sentry.ErrorBoundary fallback={<ErrorBoundaries></ErrorBoundaries>}>
  
    <LoadableDropdownInput
      loading={loading || authLoading}
      prompt={"Select a user"}
      showLabel={false}
      value={value}
      onChange={(v) => onChange(v.id)}
      values={[
        includeNone
          ? { id: null, label: "Select a user", dropdownText: "None" }
          : null,
        ...users.map((user) => ({
          id: user.id,
          label: `${user.name}${user.id === activeUser?.id ? " (You)" : ""}`,
        })),
      ].filter((v) => v)}
    />
    </Sentry.ErrorBoundary>
  </>
  );
};
