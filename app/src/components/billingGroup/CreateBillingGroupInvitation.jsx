import React, { useState } from "react";
import { Input, Util } from "tabler-react-2";
import { Button } from "#button";

export const CreateBillingGroupInvitation = ({
  createBillingGroupInvitation,
  opLoading,
  onCreated,
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
        onClick={async () => {
          const ok = await createBillingGroupInvitation(data);
          if (ok && onCreated) onCreated();
        }}
        loading={opLoading}
        disabled={opLoading}
      >
        {opLoading ? "Creating…" : "Create Invitation Link"}
      </Button>
    </div>
  );
};
