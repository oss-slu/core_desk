import React from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import { Loading } from "../../components/loading/loading";
import { Page, sidenavItems } from "../../components/page/page";
import { useAuth } from "../../hooks/useAuth";
import { Util, Typography, DropdownInput } from "tabler-react-2";
import { Avatar } from "tabler-react-2/dist/avatar";
import { LogTimeline } from "../../components/logs/timeline";
import { Table } from "tabler-react-2/dist/table";
import moment from "moment";
import { Button } from "tabler-react-2/dist/button";
import { Icon } from "../../util/Icon";
import Badge from "tabler-react-2/dist/badge";
import { useModal } from "tabler-react-2/dist/modal";
import { useShops } from "../../hooks/useShops";
import { Spinner } from "tabler-react-2/dist/spinner";
const { H1, H2, H3 } = Typography;

const AddUserToShop = ({ user }) => {
  const { shops, loading } = useShops();

  const { modal, ModalElement } = useModal({
    title: "Add User to Shop",
    text: <p>{user.name}</p>,
  });

  if (loading)
    return (
      <>
        <p>Loading Shops...</p>
        <br />
        <Spinner />
      </>
    );

  return (
    <div>
      {ModalElement}
      <Button onClick={modal}>
        <Icon i="circle-plus" size={18} /> Add {user.firstName} to a new shop
      </Button>
    </div>
  );
};

export const UserPage = () => {
  const { userId } = useParams();
  const { user, loading } = useUser(userId);
  const { user: activeUser } = useAuth();

  if (loading) return <Loading />;

  return (
    <Page sidenavItems={sidenavItems("Users", activeUser?.admin)}>
      <Util.Row gap={2}>
        <Avatar size="xl" dicebear initials={user.id} />
        <Util.Col>
          <H1>
            {user.firstName} {user.lastName}
          </H1>
          <p>{user.email}</p>
          {user.isMe && (
            <Badge color="green" soft>
              <Icon i="user" size={12} />
              This is your profile
            </Badge>
          )}
        </Util.Col>
      </Util.Row>
      <Util.Hr />
      <Util.Row
        gap={2}
        style={{
          alignItems: "flex-start",
        }}
      >
        <div style={{ width: "50%" }}>
          <H2>Shops</H2>
          {activeUser.admin && <AddUserToShop user={user} />}
          <Util.Spacer size={1} />
          <Table
            columns={[
              {
                label: "Shop",
                accessor: "shop.name",
                render: (name, context) => (
                  <a href={`/shops/${context.shop.id}`}>{name}</a>
                ),
              },
              {
                label: "Role",
                accessor: "accountType",
                render: (accountType) =>
                  activeUser.admin ? (
                    <DropdownInput
                      value={{
                        id: accountType,
                      }}
                      values={[
                        { id: "CUSTOMER", label: "Customer" },
                        { id: "OPERATOR", label: "Operator" },
                        { id: "ADMIN", label: "Admin" },
                        { id: "INSTRUCTOR", label: "Instructor" },
                      ]}
                    />
                  ) : (
                    accountType
                  ),
              },
              {
                label: "Date Joined",
                accessor: "createdAt",
                render: (createdAt) => moment(createdAt).format("MM/DD/YY"),
              },
            ]}
            data={user.shops}
          />
        </div>
        <div style={{ width: "50%" }}>
          <H2>Logs</H2>
          <LogTimeline logs={user.logs} />
        </div>
      </Util.Row>
    </Page>
  );
};
