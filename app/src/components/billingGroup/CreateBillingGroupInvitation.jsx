import React, { useState } from "react";
import { Input, Util } from "tabler-react-2";
import { Button } from "#button";

export const CreateBillingGroupInvitation = ({
  createBillingGroupInvitation,
  opLoading,
}) => {
  const [data, setData] = useState({ expires: "" });

  return (
    <div>
      <Input
        label="Expiration Date"
        type="date"
        value={data.expires?.split("T")[0]}
        onChange={(e) => setData({ ...data, expires: e + "T00:00:00" })}
      />
      <i>
        You can leave this blank to have the invitation link never expire. You
        can always change this later.
      </i>
      <Util.Spacer size={1} />
      <Button
        onClick={() => createBillingGroupInvitation(data)}
        loading={opLoading}
      >
        Create Invitation Link
      </Button>
    </div>
  );
};
