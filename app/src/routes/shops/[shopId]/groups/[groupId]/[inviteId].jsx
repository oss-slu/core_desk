import React from "react";
import { Card, Typography, Button, Util } from "tabler-react-2";
import { useBillingGroupInvitation } from "../../../../../hooks/useBillingGroupInvitation";
import { useParams } from "react-router-dom";
import { Loading } from "../../../../../components/loading/Loading";
import { useAuth, useBillingGroup } from "../../../../../hooks";
import moment from "moment";
import { MOMENT_FORMAT } from "../../../../../util/constants";

export const BillingGroupInvitationPage = () => {
  const { shopId, groupId, inviteId } = useParams();
  const {
    billingGroupInvitation,
    loading,
    acceptBillingGroupInvitation,
    opLoading,
  } = useBillingGroupInvitation(shopId, groupId, inviteId);
  const billingGroup = billingGroupInvitation.billingGroup;
  const { billingGroup: _billingGroup, loading: billingGroupLoading } =
    useBillingGroup(shopId, groupId);
  const { loggedIn, login } = useAuth();

  if (loading) return <Loading />;

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <Card title={billingGroup.title}>
        {_billingGroup?.userIsMember ? (
          <>
            <p>You are already a member of this billing group.</p>
            <Button
              color="primary"
              onClick={() => {
                window.location.href = `/shops/${shopId}/billing-groups/${groupId}`;
              }}
            >
              Go to billing group
            </Button>
          </>
        ) : billingGroupInvitation.active &&
          new Date(billingGroupInvitation.expires) >= new Date() ? (
          <>
            <p>
              You have been invited to join the billing group{" "}
              <i>{billingGroup.title}</i> by{" "}
              {billingGroup.users[0].user.firstName}{" "}
              {billingGroup.users[0].user.lastName}.
            </p>
            {billingGroupInvitation.expires && (
              <p>
                This invitation will expire on{" "}
                {moment(billingGroupInvitation.expires).format(MOMENT_FORMAT)}.
              </p>
            )}
            {loggedIn ? (
              <Button
                color="primary"
                onClick={acceptBillingGroupInvitation}
                loading={opLoading}
              >
                Join billing group
              </Button>
            ) : (
              <Button color="primary" onClick={login}>
                Log in to join billing group
              </Button>
            )}
          </>
        ) : (
          <>
            <p>This invitation has been deactivated or has expired.</p>
          </>
        )}
      </Card>
      <Util.Spacer size={1} />
      <p className="text-secondary">
        You are using SLU Open Project, a project built by SLUCAM as a unified
        platform for shops to manage projects, billing, and contacts.
      </p>
      <p className="text-secondary">
        By joining a billing group, you will be automatically added to the shop
        and group as configured by the group administrator. Items you submit
        under the billing group will be billed to the group and not to your
        individual account.
      </p>
    </div>
  );
};
