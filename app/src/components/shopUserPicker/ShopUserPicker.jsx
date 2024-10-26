import React from "react";
import { useParams } from "react-router-dom";
import { useUsers } from "../../hooks";
import { LoadableDropdownInput } from "../loadableDropdown/LoadableDropdown";

export const ShopUserPicker = ({ value, onChange, includeNone }) => {
  const { shopId } = useParams();
  const { users, loading } = useUsers(shopId);

  // return JSON.stringify(users);

  return (
    <LoadableDropdownInput
      loading={loading}
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
          label: user.name,
        })),
      ].filter((v) => v)}
    />
  );
};
