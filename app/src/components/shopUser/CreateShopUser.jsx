import React, { useState } from "react";
import { Input, Button, Util } from "tabler-react-2";

export const CreateShopUser = ({ onSubmit, opLoading }) => {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const isValid =
    data.firstName.trim() &&
    data.lastName.trim() &&
    data.email.trim() &&
    data.email.includes("@") &&
    data.email.includes(".");

  return (
    <div>
      <Input
        label="First Name"
        placeholder="e.g. Jane"
        value={data.firstName}
        onChange={(e) => setData({ ...data, firstName: e })}
      />
      <Util.Spacer size={1} />
      <Input
        label="Last Name"
        placeholder="e.g. Smith"
        value={data.lastName}
        onChange={(e) => setData({ ...data, lastName: e })}
      />
      <Util.Spacer size={1} />
      <Input
        label="Email"
        placeholder="e.g. jane.smith@example.com"
        type="email"
        value={data.email}
        onChange={(e) => setData({ ...data, email: e })}
      />
      <Util.Spacer size={2} />
      <Button
        loading={opLoading}
        disabled={!isValid}
        onClick={() => isValid && onSubmit(data)}
      >
        Create User
      </Button>
    </div>
  );
};
