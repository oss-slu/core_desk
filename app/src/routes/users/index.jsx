import React, { useState, useMemo } from "react";
import { Page, sidenavItems } from "#page";
import { useAuth } from "#useAuth";
import { Typography, Util, Badge } from "tabler-react-2";
import { useModal } from "#modal";
import { useUser, useUsers } from "#hooks";
import { Spinner } from "#spinner";
import { Avatar } from "#avatar";
import { Icon } from "#icon";
import { Link } from "react-router-dom";
import moment from "moment";
import { SearchBar } from "../../components/searchBar/SearchBar";
import { NotFound } from "../../components/404/404";
import { TableV2 } from "tabler-react-2";

const { H1 } = Typography;

export const UsersPage = () => {
  const { user } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { user: activeUser } = useUser(user?.id);

  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [sorting, setSorting] = useState([]);
  

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
  


  const ordered = useMemo(() => {
    if (!sorting.length) return filteredUsers;

    const { id, desc } = sorting[0];

    const sorted = [...filteredUsers].sort((a, b) => {
      let aVal;
      let bVal;

      switch (id) {
        case "jobCount":
          aVal = a.jobCount;
          bVal = b.jobCount;
          break;

        case "shopCount":
          aVal = a.shopCount;
          bVal = b.shopCount;
          break;

        case "name":
          aVal = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
          bVal = `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim();
          break;

        case "email":
          aVal = a.email;
          bVal = b.email;
          break;

        case "createdAt":
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;

        case "updatedAt":
          aVal = a.updatedAt;
          bVal = b.updatedAt;
          break;

        default:
          return 0;
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (id === "createdAt" || id === "updatedAt") {
        return new Date(aVal) - new Date(bVal);
      }

      if (!isNaN(aVal) && !isNaN(bVal)) {
        return Number(aVal) - Number(bVal);
      }

      return String(aVal).localeCompare(String(bVal));
    });

    return desc ? sorted.reverse() : sorted;
  }, [filteredUsers, sorting]);


  const pageData = useMemo(() => {
    const start = (page - 1) * size;
    return ordered.slice(start, start + size);
  }, [ordered, page, size]);

  console.log(filteredUsers[0]);

  const columns = useMemo(() => [
    {
      id: "id",
      header: "",
      cell: ({ row }) => {
        const id = row.original.id;
        return <Avatar size="xs" dicebear initials={id} />;
      },
    },

    {
      id: "name",
      header: "Name",
      accessorFn: (row) =>
        `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
      cell: ({ getValue, row }) => {
        const name = getValue();
        const context = row.original;

        return (
          <>
            <Link to={`/users/${context.id}`}>{name}</Link>{" "}
            {context.isMe && (
              <Badge color="green" soft>(Your account)</Badge>
            )}
            {context.suspended && (
              <Badge color="red" soft>Suspended</Badge>
            )}
          </>
        );
      },
    },

    {
      id: "email",
      header: "Email",
      accessorFn: (row) => row.email,
    },

    {
      id: "updatedAt",
      header: "updated At",
      accessorFn: (row) => row.updatedAt,
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? moment(value).format("MM/DD/YY, h:mm a") : "-";
      },
    },

    {
      id: "shopCount",
      header: "Shops",
      accessorFn: (row) => row.shopCount,
    },

    {
      id: "jobCount",
      header: "Jobs",
      accessorFn: (row) => row.jobCount,
    },

    {
      id: "createdAt",
      header: "Created At",
      accessorFn: (row) => row.createdAt,
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? moment(value).format("MM/DD/YY, h:mm a") : "-";
      },
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <Link to={`/users/${id}`}>
            <Icon i="edit" /> Edit user
          </Link>
        );
      },
    },
  ], []);


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
          setPage(1);
        }}
      />

      <Util.Spacer size={2} />

      {usersLoading ? (
        <Spinner />
      ) : (
        <>
          <TableV2
            columns={columns}
            data={pageData}
            totalRows={filteredUsers.length}
            page={page}
            size={size}
            onPageChange={setPage}
            onSizeChange={(n) => {
              setPage(1);
              setSize(n);
            }}
            sorting={sorting}
            onSortingChange={(next) => {
              setPage(1);
              setSorting(next);
            }}


          />

        </>
      )}

      {ModalElement}
    </Page>
  );
};
