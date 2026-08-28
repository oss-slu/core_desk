import React, { useState, useMemo } from "react";
import { Page } from "#page";
import { shopSidenavItems } from "..";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "#useAuth";
import { useShop } from "#hooks";
import { Loading } from "#loading";
import { Typography, Util, Badge } from "tabler-react-2";;
import moment from "moment";
import { Price } from "#renderPrice";
import { Avatar } from "#avatar";
import { SearchBar } from "../../../../components/searchBar/SearchBar";
import { TableV2 } from "tabler-react-2";
const { H1 } = Typography;

const switchAccountTypeForBadge = (type) => {
  switch (type) {
    case "ADMIN":
      return (
        <Badge color="orange" soft>
          Admin
        </Badge>
      );
    case "OPERATOR":
      return (
        <Badge color="yellow" soft>
          Operator
        </Badge>
      );
    case "GROUP_ADMIN":
      return (
        <Badge color="pink" soft>
          Group Admin
        </Badge>
      );
    default:
      return (
        <Badge color="blue" soft>
          Customer
        </Badge>
      );
  }
};

export const ShopUsersPage = () => {
  const { shopId } = useParams();
  const { user } = useAuth();
  const { userShop, loading, users } = useShop(shopId, {
    includeUsers: true,
  });

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [sorting, setSorting] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");


  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;

    return users.filter((u) =>
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
        case "balance":
          aVal = a.user?.balance;
          bVal = b.user?.balance;
          break;
        case "totalJobs":
          aVal = a.user?.totalJobs;
          bVal = b.user?.totalJobs;
          break;
        case "name":
          aVal = a.user?.name;
          bVal = b.user?.name;
          break;
        case "createdAt":
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        default:
          return 0;
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (id === "createdAt") {
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

  const columns = useMemo(() => [
    {
      id: "name",
      header: "Name",
      accessorFn: (row) => row.user?.name,
      cell: ({ row }) => {
        const context = row.original;
        return (
          <Util.Row gap={0.5} align="center">
            <Avatar size="sm" dicebear initials={context.user.id} />
            <Util.Col align="start">
              <Link to={`/shops/${shopId}/users/${context.user.id}`}>
                {context.user.name}
              </Link>
            </Util.Col>
          </Util.Row>
        );
      },
    },
    {
      id: "balance",
      header: "Balance",
      accessorFn: (row) => row.user?.balance,
      cell: ({ getValue }) => <Price value={getValue()} icon />,
    },
    {
      id: "totalJobs",
      header: "Total Jobs",
      accessorFn: (row) => row.user?.totalJobs,
    },
    {
      accessorKey: "accountType",
      header: "Account Type",
      cell: ({ getValue }) => switchAccountTypeForBadge(getValue()),
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: "Shop Member Since",
      cell: ({ getValue }) => moment(getValue()).format("MM/DD/YY"),
    },
  ], [shopId]);




  if (loading)
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Users",
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
        "Users",
        shopId,
        user.admin,
        userShop.accountType,
        userShop.balance < 0
      )}
    >
      <H1>Shop Users</H1>
      <Util.Spacer size={2} />
      <SearchBar
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
      />

      <Util.Spacer size={2} />
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
    </Page>
  );
};