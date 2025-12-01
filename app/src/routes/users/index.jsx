import React, { useState, useMemo } from "react";
import { Page, sidenavItems } from "#page";
import { useAuth } from "#useAuth";
import { Typography, Util, Badge, Button, DropdownInput } from "tabler-react-2";
import { useModal } from "#modal";
import { Table } from "#table";
import { useUser, useUsers } from "#hooks";
import { Spinner } from "#spinner";
import { Avatar } from "#avatar";
import { Icon } from "#icon";
import { Link } from "react-router-dom";
import moment from "moment";
import { SearchBar } from "../../components/searchBar/SearchBar";
import { NotFound } from "../../components/404/404";

const { H1 } = Typography;

export const UsersPage = () => {
  const { user } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { user: activeUser } = useUser(user?.id);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const { modal, ModalElement } = useModal({
    title: "Admin Only page",
    text: "This page is only accessible by global admins. This means that typical users, professors, or even shop managers are not able to see this page.",
  });

  const sidenav = useMemo(() => sidenavItems("Users", user.admin), [user.admin]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(
      (u) =>
        JSON.stringify(u).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const sortedUsers = useMemo(() => {
    if (!filteredUsers) {
      return [];
    }
    if (!sortConfig.key){
      return filteredUsers;
    }

    const sorted = [...filteredUsers].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null) {
        return 1;
      }
      if (bVal == null) {
        return -1;
      }

      //dates
      if (sortConfig.key === "lastLogin" || sortConfig.key === "createdAt") {
        const aTime = aVal ? new Date(aVal).getTime() : 0;
        const bTime = bVal ? new Date(bVal).getTime() : 0;
        return sortConfig.direction === "asc" ? aTime - bTime : bTime - aTime;
      }

      //numeric comparison
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      //string comparison
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return sorted;
  }, [filteredUsers, sortConfig]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedUsers.slice(start, end);
  }, [sortedUsers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil((filteredUsers?.length || 0) / rowsPerPage);

  const renderSortableHeader = (label, key) => (
    <span
      onClick={() => handleSort(key)}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      {label}{" "}
      {sortConfig.key === key ? (
        sortConfig.direction === "asc" ? (
          <span>▲</span>
        ) : (
          <span>▼</span>
        )
      ) : (
        ""
      )}
    </span>
  );

  if (activeUser?.simple === true) return <NotFound />;

  return (
    <Page sidenavItems={sidenav}>
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
                label: renderSortableHeader("Name", "name"),
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
              },
              {
                label: renderSortableHeader("Email", "email"),
                accessor: "email",
              },
              {
                label: renderSortableHeader("Last Login", "lastLogin"),
                accessor: "lastLogin",
                render: (v) =>
                  v ? moment(v).format("MM/DD/YY, h:mm a") : "-",
              },
              {
                label: renderSortableHeader("Shops", "shopCount"),
                accessor: "shopCount",
              },
              {
                label: renderSortableHeader("Jobs", "jobCount"),
                accessor: "jobCount",
              },
              {
                label: renderSortableHeader("Created At", "createdAt"),
                accessor: "createdAt",
                render: (v) => moment(v).format("MM/DD/YY, h:mm a"),
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
