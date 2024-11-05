import React, { useEffect, useState } from "react";
import { Input } from "tabler-react-2";

export const EditBillingGroup = ({
  billingGroup,
  opLoading,
  updateBillingGroup,
}) => {
  const [newBillingGroup, setNewBillingGroup] = useState(billingGroup);
  useEffect(() => {
    setNewBillingGroup(billingGroup);
  }, [billingGroup]);

  return (
    <>
      <Input
        label="Billing Group Title"
        placeholder="Title"
        value={newBillingGroup.title}
        onChange={(e) =>
          setNewBillingGroup({ ...newBillingGroup, title: e.target.value })
        }
      />
    </>
  );
};
