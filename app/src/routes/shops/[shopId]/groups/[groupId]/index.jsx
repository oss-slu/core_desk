import React, { useEffect, useState } from "react";
import {
  useAuth,
  useBillingGroup,
  useBillingGroupInvitations,
  useBillingGroupLedger,
  useShop,
} from "#hooks";
import { Link, useNavigate, useParams } from "react-router-dom";
import { shopSidenavItems } from "../..";
import { Page } from "#page";
import { Loading } from "#loading";
import { Button } from "#button";
import { Util, Alert, DropdownInput, Badge, Input } from "tabler-react-2";
import { useModal } from "#modal";
import { CreateBillingGroupInvitation } from "../../../../../components/billingGroup/CreateBillingGroupInvitation";
import { Table } from "#table";
import moment from "moment";
import { MOMENT_FORMAT } from "#constants";
import { EditBillingGroup } from "../../../../../components/billingGroup/EditBillingGroup";
import { switchStatusForBadge } from "../../jobs";
import { EditBillingGroupInvitation } from "../../../../../components/editBillingGroupInvitation/EditBillingGroupInvitation";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { Icon } from "#icon";
import { MarkdownRender } from "#markdownRender";
import { ShopUserPicker } from "#shopUserPicker";
import { Price } from "#renderPrice";
import { LedgerTable } from "../../../../../components/ledger/LedgerTable";

const AddUserToBillingGroupModal = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("member");
  const { shopId, groupId } = useParams();
  const { opLoading, addUserToGroup } = useBillingGroup(shopId, groupId);

  return (
    <div>
      <label className="form-label">
        Choose a user to add to the billing group
      </label>
      <ShopUserPicker value={user} onChange={setUser} />
      <label className="form-label mt-2">Role</label>
      <DropdownInput
        value={role}
        onChange={setRole}
        prompt="Pick a role"
        values={[
          {
            id: "ADMIN",
            label: "Admin",
          },
          {
            id: "MEMBER",
            label: "Member",
          },
        ]}
      />
      <Button
        className="mt-2"
        variant="primary"
        onClick={async () => {
          await addUserToGroup(user, role.id);
          navigate(0);
        }}
        disabled={!user || !role}
        loading={opLoading}
      >
        Add User
      </Button>
    </div>
  );
};

const AddGroupBalanceModalContent = ({ postLedgerItem, opLoading }) => {
  const [type, setType] = useState(null);
  const [value, setValue] = useState(0);

  return (
    <Util.Col gap={1}>
      <div>
        <label className="form-label">Add balance type</label>
        <DropdownInput
          label="Type"
          values={[
            { label: "Topup", id: "MANUAL_TOPUP" },
            { label: "Deposit", id: "MANUAL_DEPOSIT" },
            { label: "User Purchased", id: "FUNDS_PURCHASED" },
            { label: "Reduction", id: "MANUAL_REDUCTION" },
          ]}
          value={type}
          onChange={(v) => setType(v.id)}
          prompt="Select type"
        />
      </div>
      <Input
        type="number"
        label="Amount"
        value={value}
        onChange={(v) => setValue(v)}
        placeholder="Select an amount"
        prependedText="$"
      />
      <i>
        A topup will bring the group's balance to the specified amount if it is
        lower than that amount. A deposit will add the fixed amount.
      </i>
      <Button
        loading={opLoading}
        onClick={async () => {
          await postLedgerItem({ type, value });
        }}
      >
        Post Ledger Item
      </Button>
    </Util.Col>
  );
};

export const BillingGroupPage = () => {
  const { shopId, groupId } = useParams();
  const { user } = useAuth();
  const { userShop } = useShop(shopId);
  const navigate = useNavigate();

  const {
    billingGroup,
    loading,
    opLoading,
    updateBillingGroup,
    refetch: refetchBillingGroup,
    removeUserFromGroup,
    deleteBillingGroup,
  } = useBillingGroup(shopId, groupId);

  const {
    billingGroupInvitations,
    loading: loadingInvitations,
    createBillingGroupInvitation,
    opLoading: opLoadingInvitations,
  } = useBillingGroupInvitations(shopId, groupId);
  const {
    ledger,
    loading: ledgerLoading,
    balance,
    postLedgerItem,
    opLoading: ledgerOpLoading,
  } = useBillingGroupLedger(shopId, groupId);

  const { modal, ModalElement, close, update } = useModal({
    title: "Create a new invitation link",
    text: (
      <CreateBillingGroupInvitation
        createBillingGroupInvitation={createBillingGroupInvitation}
        opLoading={opLoadingInvitations}
        onCreated={() => close(true)}
      />
    ),
  });

  const { modal: selectUserModal, ModalElement: SelectUserModalElement } =
    useModal({
      title: "Add a user to the billing group",
      text: (
        <AddUserToBillingGroupModal
          billingGroup={billingGroup}
          shopId={shopId}
          refetch={refetchBillingGroup}
        />
      ),
    });
  const { modal: addLedgerItemModal, ModalElement: AddLedgerItemModal } =
    useModal({
      title: "Post ledger item",
      text: (
        <AddGroupBalanceModalContent
          postLedgerItem={postLedgerItem}
          opLoading={ledgerOpLoading}
        />
      ),
    });

  const [editing, setEditing] = useState(false);

  const [copiedText, copyToClipboard] = useCopyToClipboard();

  const userIsPrivileged =
    user.admin ||
    userShop.accountType === "ADMIN" ||
    userShop.accountType === "OPERATOR" ||
    billingGroup?.userRole === "ADMIN";
  const userIsStaff =
    user.admin ||
    userShop.accountType === "ADMIN" ||
    userShop.accountType === "OPERATOR";

  useEffect(() => {
    update();
  }, [opLoadingInvitations, billingGroupInvitations?.length]);

  if (loading || loadingInvitations || ledgerLoading)
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Billing Groups",
          shopId,
          user.admin,
          userShop.accountType,
          userShop.balance < 0,
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
        userShop.balance < 0,
      )}
    >
      {ModalElement}
      {SelectUserModalElement}
      {AddLedgerItemModal}
      <Util.Row justify="between" align="center">
        <h1>{billingGroup.title}</h1>
        <Util.Row gap={1}>
          <Button
            variant="primary"
            href={`/shops/${shopId}/billing-groups/${groupId}/portal`}
          >
            Portal
          </Button>
          {userIsPrivileged &&
            (editing ? (
              <Button
                variant="secondary"
                outline
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            ) : (
              <Button onClick={() => setEditing(true)}>Edit</Button>
            ))}
        </Util.Row>
      </Util.Row>
      {billingGroup.adminUsers?.length == 0 &&
      billingGroup.users?.length == 0 ? (
        <Alert variant="danger" title="No Members">
          This group does not have any members
        </Alert>
      ) : (
        <></>
      )}
      {editing ? (
        <>
          <EditBillingGroup
            billingGroup={billingGroup}
            opLoading={opLoading}
            updateBillingGroup={updateBillingGroup}
            onFinish={async () => {
              await refetchBillingGroup(false);
              setEditing(false);
            }}
            onDelete={async () => {
              if (
                window.confirm(
                  "Are you sure you want to delete this billing group?",
                )
              ) {
                const success = await deleteBillingGroup();
                if (success) {
                  navigate(`/shops/${shopId}/billing-groups`);
                }
              }
            }}
            // updateBillingGroup={console.log}
          />
        </>
      ) : (
        <p>
          <b>Admin</b>: {billingGroup.adminUsers?.[0]?.name || "Unset"}
          <br />
          {billingGroup.userCount} user{billingGroup.userCount != 1 ? "s" : ""}
        </p>
      )}
      <Util.Spacer size={1} />
      {!editing && (
        <>
          <Util.Row justify="between" align="center">
            <h2>Ledger</h2>
            {userIsStaff && (
              <Button onClick={addLedgerItemModal}>Post ledger item</Button>
            )}
          </Util.Row>
          <Util.Spacer size={1} />
          <p>
            Current balance:
            <Price value={balance} icon size={24} />
          </p>
          <Util.Spacer size={1} />
          <LedgerTable data={ledger} shopId={shopId} />
          <Util.Spacer size={2} />
        </>
      )}
      {userIsPrivileged && !editing && (
        <>
          <Util.Row justify="between" align="center">
            <h2>Invitations</h2>
            <Util.Row gap={1}>
              <Button onClick={selectUserModal}>Add a user</Button>
              <Button onClick={modal}>Create a new invitation link</Button>
            </Util.Row>
          </Util.Row>
          <Util.Spacer size={1} />
          {billingGroupInvitations?.length === 0 ? (
            <i>
              You do not have any invitation links.{" "}
              <Link onClick={modal}>You can create one here.</Link>
            </i>
          ) : (
            <Table
              columns={[
                {
                  label: "Link",
                  accessor: "id",
                  render: (id) => (
                    <Util.Row align="center" gap={1}>
                      <Link
                        to={`/shops/${shopId}/billing-groups/${groupId}/invitations/${id}`}
                      >
                        Link
                      </Link>
                      <Button
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            `${document.location.origin}/shops/${shopId}/billing-groups/${groupId}/invitations/${id}`,
                          )
                        }
                      >
                        {copiedText ===
                        `${document.location.origin}/shops/${shopId}/billing-groups/${groupId}/invitations/${id}` ? (
                          <Icon i="check" />
                        ) : (
                          <Icon i="copy" />
                        )}
                      </Button>
                    </Util.Row>
                  ),
                },
                {
                  label: "Expires",
                  accessor: "expires",
                  sortable: true,
                  render: (e) => (
                    <span>
                      {moment(e).format(MOMENT_FORMAT) || "Never"}{" "}
                      {e && moment(e).isBefore(moment()) && (
                        <Badge color="red" soft>
                          Expired
                        </Badge>
                      )}
                    </span>
                  ),
                },
                {
                  label: "Active",
                  accessor: "active",
                  render: (a) =>
                    a ? (
                      <Badge color="green" soft>
                        Yes
                      </Badge>
                    ) : (
                      <Badge color="red" soft>
                        No
                      </Badge>
                    ),
                  sortable: true,
                },
                {
                  label: "Edit",
                  accessor: "id",
                  render: (id) => (
                    <EditBillingGroupInvitation
                      invitationId={id}
                      refetch={() => document.location.reload()}
                    />
                  ),
                },
              ]}
              data={billingGroupInvitations || []}
            />
          )}
          <Util.Spacer size={2} />
          <h2>Users</h2>
          <p>
            {billingGroup.userCount} user{billingGroup.userCount > 1 ? "s" : ""}
          </p>
          <Table
            columns={[
              {
                label: "Name",
                accessor: "user",
                render: (u) => (
                  <span>
                    {u.firstName + " " + u.lastName}{" "}
                    {u.id === user.id && (
                      <Badge color="green" soft>
                        You{" "}
                      </Badge>
                    )}
                  </span>
                ),
              },
              {
                label: "Email",
                accessor: "user.email",
                render: (email) => <Link to={`mailto:${email}`}>{email}</Link>,
              },
              {
                label: "Joined at",
                accessor: "createdAt",
                render: (c) => moment(c).format(MOMENT_FORMAT),
              },
              {
                label: "Role",
                accessor: "role",
                render: (role) => (
                  <Badge color="blue" soft>
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </Badge>
                ),
              },
              {
                label: "Remove",
                accessor: "user.id",
                render: (id) =>
                  id === user.id ? (
                    <></>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      outline
                      onClick={() => removeUserFromGroup(id)}
                      loading={opLoading}
                    >
                      <Icon i="plug-connected-x" /> Remove
                    </Button>
                  ),
              },
            ]}
            data={billingGroup.users || []}
          />
          <Util.Spacer size={2} />
          <h2>Jobs</h2>
          {billingGroup.jobs?.length === 0 ? (
            <i>
              There are no jobs in this billing group. You can add jobs by
              clicking the "Edit" button above and turning on job connections.
            </i>
          ) : (
            <Table
              columns={[
                {
                  label: "Title",
                  accessor: "title",
                  render: (title, context) => (
                    <Link to={`/shops/${shopId}/jobs/${context.id}`}>
                      {title}
                    </Link>
                  ),
                },
                {
                  label: "Items",
                  accessor: "id",
                  render: (id, context) => (
                    <span>
                      <span className="text-red">
                        {context.unapprovedItems} Needs Approval
                      </span>
                      <br />
                      <span className="text-green">
                        {context.approvedItems} Approved
                      </span>
                      <br />
                      <span className="text-orange">
                        {context.rejectedItems} Rejected
                      </span>
                    </span>
                  ),
                },

                {
                  label: "Status",
                  accessor: "status",
                  render: (status) => switchStatusForBadge(status),
                },
                {
                  label: "Created At",
                  accessor: "createdAt",
                  render: (createdAt) =>
                    moment(createdAt).format(MOMENT_FORMAT),
                },
                {
                  label: "Due Date",
                  accessor: "dueDate",
                  render: (dueDate) => (
                    <>
                      {moment(dueDate).format("MM/DD/YY")} (
                      {moment(dueDate).fromNow()})
                    </>
                  ),
                },
              ]}
              data={billingGroup.jobs || []}
            />
          )}
          <Util.Spacer size={2} />
          <h2>Description</h2>
          <MarkdownRender markdown={billingGroup.description} />
        </>
      )}
    </Page>
  );
};
