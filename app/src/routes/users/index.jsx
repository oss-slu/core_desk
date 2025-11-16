import React, { useState, useMemo } from "react";
import { Page, sidenavItems } from "#page";
import { useAuth } from "#useAuth";
import { Typography, Util, Badge } from "tabler-react-2";
import { useModal } from "#modal";
import { Table } from "#table";
import { useUsers } from "../../hooks/useUsers";
import { Spinner } from "#spinner";
import { Avatar } from "#avatar";
import { Icon } from "#icon";
import { Link } from "react-router-dom";
import moment from "moment";
import { SearchBar } from "../../components/searchBar/SearchBar";
import { Button } from "tabler-react-2";
import { DropdownInput } from "tabler-react-2";

const { H1 } = Typography;

export const UsersPage = () => {
  const { user } = useAuth();
  const { users, loading: usersLoading } = useUsers();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");

  const { modal, ModalElement } = useModal({
    title: "Admin Only page",
    text: "This page is only accessible by global admins. This means that typical users, professors, or even shop managers are not able to see this page.",
  });

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(
      (u) =>
        JSON.stringify(u).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil((filteredUsers?.length || 0) / rowsPerPage);

  return (
    <Page sidenavItems={sidenavItems("Users", user.admin)}>
      <H1>Users</H1>
      <Badge color="red" onClick={modal}>
        Admin Only
      </Badge>

      <Util.Spacer size={2} />
      <SearchBar
        onSearch={(value) => {
          setSearchTerm(value);
          setCurrentPage(1); 
        }}
      />

      <Util.Spacer size={2} />

      {usersLoading ? (
        <Spinner />
      ) : (
        <>
          <Table
            columns={[
              {
                label: "",
                accessor: "id",
                render: (id) => <Avatar size="xs" dicebear initials={id} />,
              },
              {
                label: "Name",
                accessor: "name",
                render: (name, context) => (
                  <>
                    <Link to={`/users/${context.id}`}>{name}</Link>{" "}
                    {context.isMe && (
                      <Badge color="green" soft>
                        (Your account)
                      </Badge>
                    )}
                    {context.suspended && (
                      <Badge color="red" soft>
                        Suspended
                      </Badge>
                    )}
                  </>
                ),
                sortable: true,
              },
              { label: "Email", accessor: "email", sortable: true },
              {
                label: "Last login",
                accessor: "lastLogin",
                sortable: true,
                render: (v) =>
                  v ? moment(v).format("MM/DD/YY, h:mm a") : "-",
              },
              { label: "Shops", accessor: "shopCount" },
              { label: "Jobs", accessor: "jobCount" },
              {
                label: "Flags",
                accessor: "admin",
                render: (v, context) =>
                  v ? (
                    <Util.Row gap={0.5} wrap>
                      {context.admin && (
                        <Badge color="green" soft>
                          Admin
                        </Badge>
                      )}
                      {context.suspended && (
                        <Badge color="red" soft>
                          Suspended
                        </Badge>
                      )}
                    </Util.Row>
                  ) : (
                    "No"
                  ),
              },
              {
                label: "Created at",
                accessor: "createdAt",
                render: (v) => moment(v).format("MM/DD/YY, h:mm a"),
                sortable: true,
              },
              {
                label: "Actions",
                accessor: "id",
                render: (id) => (
                  <Link to={`/users/${id}`}>
                    <Icon i="edit" /> Edit user
                  </Link>
                ),
              },
            ]}
            data={paginatedUsers}
          />

          <Util.Row
            justify="center"
            align="center"
            gap={1}
            style={{ marginTop: "1rem" }}
          >
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
            >
              Next
            </Button>
            <DropdownInput
              value={rowsPerPage}
              onChange={(item) => {
                setRowsPerPage(Number(item.id));
                setCurrentPage(1);
              }}
              items={[
                { id: 10, label: "10 per page" },
                { id: 25, label: "25 per page" },
                { id: 50, label: "50 per page" },
                { id: 100, label: "100 per page" },
              ]}
              prompt="Rows per page"
              showSearch={false}            
              style={{ marginLeft: "1rem" }}
            />
          </Util.Row>
        </>
      )}

      {ModalElement}
    </Page>
  );
};
