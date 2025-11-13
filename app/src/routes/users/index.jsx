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

  // 🔍 Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // 📄 Paginate filtered users
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
        placeholder="Search by name or email..."
        onSearch={(value) => {
          setSearchTerm(value);
          setCurrentPage(1); // Reset pagination on search
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

          {/* 📄 Pagination controls */}
          <Util.Row
            justify="center"
            align="center"
            gap={1}
            style={{ marginTop: "1rem" }}
          >
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
            >
              Next
            </button>

            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ marginLeft: "1rem" }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </Util.Row>
        </>
      )}

      {ModalElement}
    </Page>
  );
};
