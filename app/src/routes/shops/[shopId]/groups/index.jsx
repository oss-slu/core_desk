import React from "react";
import { Loading } from "../../../../components/loading/Loading";
import { shopSidenavItems } from "..";
import { Page } from "../../../../components/page/page";
import { useAuth, useBillingGroups, useShop } from "../../../../hooks";
import { Link, useParams } from "react-router-dom";
import { Util } from "tabler-react-2";
import { Button } from "tabler-react-2/dist/button";
import { useModal } from "tabler-react-2/dist/modal";
import { CreateBillingGroup } from "../../../../components/billingGroup/CreateBillingGroup";
import { Table } from "tabler-react-2/dist/table";
import moment from "moment";
import { MOMENT_FORMAT } from "../../../../util/constants";

export const BillingGroupsPage = () => {
  const { shopId } = useParams();
  const { user } = useAuth();
  const { userShop, shop } = useShop(shopId);
  const { billingGroups, loading, createBillingGroup, opLoading } =
    useBillingGroups(shopId);

  const { modal, ModalElement } = useModal({
    title: "Create Billing Group",
    text: (
      <CreateBillingGroup
        userShop={userShop}
        createBillingGroup={createBillingGroup}
        opLoading={opLoading}
        user={user}
      />
    ),
  });

  if (loading)
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Billing Groups",
          shopId,
          user.admin,
          userShop.accountType,
          userShop.balance < 0
        )}
      >
        <Loading />
      </Page>
    );

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Billing Groups",
        shopId,
        user.admin,
        userShop.accountType,
        userShop.balance < 0
      )}
    >
      {ModalElement}
      <Util.Row justify="between" align="center">
        <h1>Billing Groups</h1>
        <Button onClick={modal}>Create Billing Group</Button>
      </Util.Row>
      <Util.Spacer size={1} />
      <Table
        columns={[
          {
            label: "Title",
            accessor: "title",
            render: (title, context) => (
              <Link to={`/shops/${shopId}/billing-groups/${context.id}`}>
                {title}
              </Link>
            ),
          },
          {
            label: "Created at",
            accessor: "createdAt",
            render: (date) => moment(date).format(MOMENT_FORMAT),
          },
          {
            label: "User Count",
            accessor: "userCount",
          },
          {
            label: "Admin",
            accessor: "adminUsers",
            render: (adminUsers) => adminUsers[0].name,
          },
        ]}
        data={billingGroups}
      />
    </Page>
  );
};
