import React, { useEffect, useState } from "react";
import { useBillingGroupInvitation } from "../../hooks/useBillingGroupInvitation";
import { Button } from "#button";
import { Icon } from "../../util/Icon";
import { Input, Switch } from "tabler-react-2";
import { useModal } from "#useModal";
import { Spinner } from "#spinner";
import { useParams } from "react-router-dom";

const EditBillingGroupInvitationModalContent = ({ invitationId, refetch }) => {
  const { shopId, groupId } = useParams();

  const { billingGroupInvitation, updateBillingGroupInvitation, opLoading } =
    useBillingGroupInvitation(shopId, groupId, invitationId);

  const [newInvitation, setNewInvitation] = useState(billingGroupInvitation);
  useEffect(() => {
    setNewInvitation(billingGroupInvitation);
  }, [billingGroupInvitation]);

  if (!newInvitation?.id) return <Spinner />;

  return (
    <div>
      <Input
        label="Expiration Date"
        type="date"
        value={newInvitation.expires?.split("T")[0]}
        onChange={(e) =>
          setNewInvitation({ ...newInvitation, expires: e + "T00:00:00" })
        }
      />
      <Switch
        label="Active"
        value={newInvitation.active}
        onChange={(e) => setNewInvitation({ ...newInvitation, active: e })}
      />
      <Button
        onClick={async () => {
          await updateBillingGroupInvitation(newInvitation);
          refetch && refetch();
        }}
        loading={opLoading}
      >
        Save
      </Button>
    </div>
  );
};

export const EditBillingGroupInvitation = ({ invitationId, refetch }) => {
  const { modal, ModalElement } = useModal({
    title: "Edit invitation",
    text: (
      <EditBillingGroupInvitationModalContent
        invitationId={invitationId}
        refetch={refetch}
      />
    ),
  });

  return (
    <>
      {ModalElement}
      <Button size="sm" onClick={modal}>
        <Icon i="pencil" /> Edit
      </Button>
    </>
  );
};
