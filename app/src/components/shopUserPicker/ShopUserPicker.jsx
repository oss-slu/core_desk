import React from "react";
import { useParams } from "react-router-dom";
import { useAuth, useUsers } from "#hooks";
import { LoadableDropdownInput } from "#loadableDropdown";

export const ShopUserPicker = ({ value, onChange, includeNone }) => {
  const { shopId } = useParams();
  const { users, loading } = useUsers(shopId);
  const { user: activeUser, loading: authLoading } = useAuth();

  return (
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
  );
};
