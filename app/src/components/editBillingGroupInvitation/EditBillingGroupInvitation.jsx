import React, { useEffect, useState } from "react";
import { useBillingGroupInvitation } from "#useBillingGroupInvitation";
import { Button } from "#button";
import { Icon } from "#icon";
import { Input, Switch } from "tabler-react-2";
import { useModal } from "#modal";
import { Spinner } from "#spinner";
import { useParams } from "react-router-dom";
import ErrorBoundaries from "../ErrorBoundaries/ErrorBoundaries";
import * as Sentry from "@sentry/react";
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
    <>
    <Sentry.ErrorBoundary fallback={<ErrorBoundaries></ErrorBoundaries>}>
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
    </Sentry.ErrorBoundary>
    
    </>
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
    <Sentry.ErrorBoundary fallback={<ErrorBoundaries></ErrorBoundaries>}>
      {ModalElement}
      <Button size="sm" onClick={modal}>
        <Icon i="pencil" /> Edit
      </Button>
    
    </Sentry.ErrorBoundary>
    </>

  );
};
